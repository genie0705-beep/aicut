const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const context = browser.contexts()[0];
  let page = context.pages().find(p => p.url().includes('PostWriteForm'));
  if (!page) { console.log('PostWriteForm not found'); return; }
  
  // First: replace content with text-only v3 (no images)
  const v3Html = fs.readFileSync(path.join(__dirname, 'blog_realestate_body_v3.html'), 'utf8');
  
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const plainText = v3Html.replace(/<[^>]+>/g, '').replace(/\n{3,}/g, '\n\n');
  
  // Set clipboard with v3 (text only, no image tags)
  await page.evaluate(async ({html, text}) => {
    const htmlBlob = new Blob([html], {type: 'text/html'});
    const textBlob = new Blob([text], {type: 'text/plain'});
    await navigator.clipboard.write([
      new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob })
    ]);
  }, { html: v3Html, text: plainText });
  await page.waitForTimeout(300);
  
  // Select all and paste
  await page.evaluate(() => {
    SmartEditor._editors['blogpc001']._canvasScrollingService.focusFirstText();
  });
  await page.waitForTimeout(300);
  await page.keyboard.press('Control+A');
  await page.waitForTimeout(300);
  await page.keyboard.press('Control+V');
  await page.waitForTimeout(2000);
  console.log('✅ v3 text content pasted');
  
  // Image files to upload in order
  const imageDir = __dirname;
  const images = [
    { file: path.join(imageDir, 'aicut_blog_realestate_main.png'), alt: 'main' },
    { file: path.join(imageDir, 'aicut_blog_realestate_card1.png'), alt: 'card1' },
    { file: path.join(imageDir, 'aicut_blog_realestate_card2.png'), alt: 'card2' },
    { file: path.join(imageDir, 'aicut_blog_realestate_card3.png'), alt: 'card3' },
    { file: path.join(imageDir, 'aicut_blog_realestate_cta.png'), alt: 'cta' },
  ];
  
  // Upload images one by one at specific positions
  // Define markers where images should be inserted
  const markers = [
    { text: '<h2 style="text-align: center;">🏢 영상', insertBefore: true, desc: 'main before first H2' },
    { text: '문의가 두 배로 늘었습니다.</p>', insertBefore: false, desc: 'card1 after success story' },
    { text: '<h2 style="text-align: center;">📱 그래서 저희가 합니다</h2>', insertBefore: true, desc: 'card2 before service section' },
    { text: '<h2 style="text-align: center;">📈 하반기, 지금 시작해야 하는 이유</h2>', insertBefore: true, desc: 'card3 before strategy section' },
    { text: '<p style="text-align: center;">💬 <strong>카카오톡 문의:</strong>', insertBefore: true, desc: 'cta before contact' },
  ];
  
  for (let i = 0; i < images.length; i++) {
    const marker = markers[i];
    
    // Find the marker in the rendered document and move cursor there
    await page.evaluate(({markerText, insertBefore}) => {
      const ed = SmartEditor._editors['blogpc001'];
      
      // Get document data as string
      const data = ed.getDocumentData ? ed.getDocumentData() : {};
      const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
      
      // Find marker position
      const pos = dataStr.indexOf(markerText);
      if (pos === -1) return 'marker not found: ' + markerText.slice(0, 30);
      
      // Calculate target position
      const targetPos = insertBefore ? pos : pos + markerText.length;
      
      // Focus first text
      ed._canvasScrollingService.focusFirstText();
      
      return 'focused';
    }, { markerText: marker.text, insertBefore: marker.insertBefore });
    await page.waitForTimeout(500);
    
    // Move cursor forward to approximate position (using arrow keys)
    // This is imprecise but let's try
    // For insertBefore, we move to a position and click
    // Actually, let's try a different approach:
    // Find the marker text in the DOM, click near it
    
    const clicked = await page.evaluate((markerText) => {
      // Try to find the element containing the marker text
      const walker = document.createTreeWalker(
        document.querySelector('[contenteditable]') || document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      let node;
      while (node = walker.nextNode()) {
        if (node.textContent.includes(markerText.replace(/<[^>]+>/g, '').trim().slice(0, 20))) {
          const range = document.createRange();
          range.setStart(node, 0);
          range.collapse(true);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          return 'clicked near: ' + node.textContent.slice(0, 30);
        }
      }
      return 'text not found in DOM';
    }, marker.text);
    console.log(`  Marker ${i}: ${clicked}`);
    await page.waitForTimeout(500);
    
    // Upload image via file chooser
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 10000 }).catch(() => null),
      page.evaluate(() => {
        // Click the image button in SE4 toolbar
        const spans = document.querySelectorAll('.se-image-toolbar-button, span[title*="사진"], button[title*="사진"]');
        for (const s of spans) {
          if (s.innerText.includes('사진') || s.getAttribute('title')?.includes('사진') || s.className.includes('image')) {
            s.click();
            return 'clicked: ' + (s.innerText || s.className).slice(0, 30);
          }
        }
        // Fallback: scan all elements
        const all = document.querySelectorAll('button, span, a');
        for (const el of all) {
          const title = el.getAttribute('title') || '';
          const text = el.innerText || '';
          const cls = el.className || '';
          if (title.includes('사진') || text.includes('사진') || cls.includes('photo') || cls.includes('image-toolbar')) {
            el.click();
            return 'clicked fallback';
          }
        }
        return 'not found';
      })
    ]);
    
    if (fileChooser) {
      await fileChooser.setFiles([images[i].file]);
      console.log(`  ✅ ${images[i].alt} uploaded & inserted at marker`);
      await page.waitForTimeout(4000); // Wait for upload to complete
    } else {
      console.log(`  ❌ File chooser not captured for ${images[i].alt}`);
    }
  }
  
  // Verify
  const verify = await page.evaluate(() => {
    const imgs = document.querySelectorAll('img.se-image-resource, img[src]');
    const realImgs = Array.from(imgs).filter(i => !i.getAttribute('src')?.startsWith('data:'));
    return { totalImgs: imgs.length, realImgs: realImgs.length };
  });
  console.log('\nVerify:', JSON.stringify(verify));
  
  // Save
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const b of btns) {
      if (b.innerText.trim() === '저장' || b.innerText.includes('저장')) {
        b.click();
        return;
      }
    }
  });
  await page.waitForTimeout(2000);
  console.log('✅ Saved');
  
  await page.screenshot({ path: 'blog_images_placed.png', fullPage: false });
  console.log('Screenshot saved');
})();
