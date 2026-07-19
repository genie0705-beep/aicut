const { chromium } = require('playwright');
const path = require('path');
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  try {
    await page.goto('https://blog.naver.com/aicut/224341544476', { waitUntil: 'load', timeout: 20000 });
    await sleep(4000);
    
    const pf = page.frames().find(f => f.url().includes('PostView'));
    if (pf) {
      await pf.evaluate(() => {
        document.querySelector('a._modifyPost')?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      });
    }
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    await sleep(5000);

    const editFrame = page.frames().find(f => f.url().includes('PostUpdateForm'));
    if (!editFrame) { console.log('iframe not found'); return; }
    
    // Remove old images first 
    await editFrame.evaluate(() => {
      const se = window.SmartEditor?.instance || window.SmartEditor?._editors?.blogpc001;
      if (!se) return;
      const doc = se._documentService.getDocumentData();
      doc.document.components = doc.document.components.filter(c => c['@ctype'] !== 'image');
      se._documentService.setDocumentData(doc);
    });
    
    // Upload one image and track it
    console.log('📤 이미지 업로드 테스트...');
    const imagePath = path.resolve(__dirname, 'aicut_blog_dental_main.png');
    
    // Click 사진 button and wait for filechooser
    const fcPromise = page.waitForEvent('filechooser', { timeout: 10000 });
    await editFrame.click('button.se-image-toolbar-button');
    const fc = await fcPromise;
    console.log('✅ filechooser captured');
    
    await fc.setFiles([imagePath]);
    console.log('✅ files set');
    
    // Wait and check document for new image component
    for (let i = 0; i < 10; i++) {
      await sleep(2000);
      const imgCount = await editFrame.evaluate(() => {
        const se = window.SmartEditor?.instance || window.SmartEditor?._editors?.blogpc001;
        if (!se) return -1;
        const doc = se._documentService.getDocumentData();
        return doc.document.components.filter(c => c['@ctype'] === 'image').length;
      });
      console.log(`  [${i+1}] 이미지 컴포넌트 수: ${imgCount}`);
      if (imgCount > 0) break;
    }
    
    // Show the new image component data
    const imgData = await editFrame.evaluate(() => {
      const se = window.SmartEditor?.instance || window.SmartEditor?._editors?.blogpc001;
      if (!se) return null;
      const doc = se._documentService.getDocumentData();
      const imgs = doc.document.components.filter(c => c['@ctype'] === 'image');
      return imgs.map(img => ({
        fileName: img.fileName,
        src: (img.src || '').substring(0, 100),
        width: img.width,
        height: img.height,
        align: img.align,
      }));
    });
    
    console.log('\n이미지 데이터:', JSON.stringify(imgData, null, 2));

  } finally {
    await page.close();
  }
})();
