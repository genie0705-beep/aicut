const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const context = browser.contexts()[0];
  let page = context.pages().find(p => p.url().includes('PostWriteForm'));
  if (!page) {
    page = await context.newPage();
    await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(3000);
  }
  
  // Get list of image files
  const imageDir = __dirname;
  const imageFiles = [
    path.join(imageDir, 'aicut_blog_realestate_main.png'),
    path.join(imageDir, 'aicut_blog_realestate_card1.png'),
    path.join(imageDir, 'aicut_blog_realestate_card2.png'),
    path.join(imageDir, 'aicut_blog_realestate_card3.png'),
    path.join(imageDir, 'aicut_blog_realestate_cta.png'),
  ];
  
  // Try to find image upload button and trigger file chooser
  // SE4 has a dedicated image upload button in the toolbar
  const btnFound = await page.evaluate(() => {
    // Look for image-related buttons in the toolbar
    const selectors = [
      'button[title*="사진"]',
      'button[title*="이미지"]',
      'button[title*="Picture"]',
      'button[title*="Image"]',
      '.se-toolbar button:has(svg)',
      '.editor_toolbar button',
      'button._photoBtn',
    ];
    
    for (const sel of selectors) {
      try {
        const el = document.querySelector(sel);
        if (el) return 'found: ' + sel;
      } catch(e) {}
    }
    
    // Scan all toolbar buttons
    const toolbars = document.querySelectorAll('.se-toolbar, .smart_editor_toolbar, .editor_toolbar, [class*="toolbar"]');
    let foundBtns = [];
    toolbars.forEach(tb => {
      const btns = tb.querySelectorAll('button, a, span[role="button"]');
      btns.forEach(b => {
        const title = (b.getAttribute('title') || '').toLowerCase();
        const text = (b.innerText || '').toLowerCase();
        const cls = (b.className || '').toLowerCase();
        if (title.includes('사진') || title.includes('이미지') || title.includes('그림') ||
            text.includes('사진') || text.includes('이미지') || text.includes('그림') ||
            cls.includes('photo') || cls.includes('image') || cls.includes('picture') ||
            b.querySelector('svg[class*="photo"], svg[class*="image"], [class*="icon-photo"], [class*="icon-image"]')) {
          foundBtns.push({ title: b.getAttribute('title'), text: b.innerText.slice(0, 10), cls: b.className.slice(0, 30) });
        }
      });
    });
    
    if (foundBtns.length > 0) return 'found buttons: ' + JSON.stringify(foundBtns);
    return 'no image buttons found';
  });
  console.log('Image button search:', btnFound);
  
  // Try clicking any image-related toolbar button and capture file chooser
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser', { timeout: 8000 }).catch(() => null),
    page.evaluate(() => {
      // Scan all buttons comprehensively
      const all = document.querySelectorAll('button, a, [role="button"], span[onclick]');
      for (const el of all) {
        const html = el.outerHTML.toLowerCase();
        if (html.includes('사진') || html.includes('이미지') || html.includes('photo') || html.includes('image')) {
          if (el.tagName === 'SPAN' || el.tagName === 'A') {
            el.click();
            return 'clicked via text match: ' + el.tagName;
          }
          el.click();
          return 'clicked: ' + el.tagName;
        }
      }
      // Try clicking directly on toolbar spans
      const spans = document.querySelectorAll('.se-toolbar span');
      for (const s of spans) {
        if (s.getAttribute('title')?.includes('사진') || s.innerText.includes('사진')) {
          s.click();
          return 'clicked toolbar span';
        }
      }
      return 'nothing clicked';
    })
  ]);
  
  console.log('File chooser captured:', !!fileChooser);
  
  if (fileChooser) {
    await fileChooser.setFiles(imageFiles);
    console.log('✅ Images uploaded via file chooser');
    await page.waitForTimeout(5000);
  } else {
    console.log('⚠️ File chooser not captured - images will need manual upload');
  }
  
  // === Find and click Save button ===
  const saveResult = await page.evaluate(() => {
    // Look for save button
    const btns = document.querySelectorAll('button, a, [role="button"]');
    for (const b of btns) {
      const text = b.innerText.trim();
      if (text === '저장' || text === '임시저장' || text.includes('저장')) {
        b.click();
        return 'clicked: ' + text;
      }
    }
    return 'save button not found';
  });
  console.log('Save:', saveResult);
  await page.waitForTimeout(2000);
  
  await page.screenshot({ path: 'blog_saved_state.png', fullPage: false });
  console.log('Screenshot saved');
  console.log('\n✅ Blog post process complete!');
})();
