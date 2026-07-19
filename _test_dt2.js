const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
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

    // Remove old images
    await editFrame.evaluate(() => {
      const se = window.SmartEditor?.instance || window.SmartEditor?._editors?.blogpc001;
      if (!se) return;
      const doc = se._documentService.getDocumentData();
      doc.document.components = doc.document.components.filter(c => c['@ctype'] !== 'image');
      se._documentService.setDocumentData(doc);
    });

    console.log('input[type=file] DataTransfer 방식...');
    const imagePath = path.resolve(__dirname, 'aicut_blog_dental_main.png');
    const imageBuf = fs.readFileSync(imagePath);
    
    // Use setInputFiles on the hidden input directly (Playwright's way)
    const fileInput = await editFrame.$('#hidden-file');
    if (!fileInput) {
      console.log('❌ #hidden-file input not found');
      return;
    }
    
    console.log('✅ #hidden-file found');
    
    // Method 1: Playwright setInputFiles (this is the proper way)
    await fileInput.setInputFiles([imagePath]);
    console.log('✅ setInputFiles done');
    
    // Trigger change event
    await editFrame.evaluate(() => {
      const input = document.querySelector('#hidden-file');
      if (input) {
        input.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('change event dispatched');
      }
    });
    
    console.log('change event dispatched');
    
    // Wait for SE4 to process
    for (let i = 0; i < 10; i++) {
      await sleep(2000);
      const state = await editFrame.evaluate(() => {
        const se = window.SmartEditor?.instance || window.SmartEditor?._editors?.blogpc001;
        if (!se) return null;
        const doc = se._documentService.getDocumentData();
        return {
          images: doc.document.components.filter(c => c['@ctype'] === 'image').length,
          total: doc.document.components.length,
        };
      });
      console.log(`  [${i+1}] images: ${state?.images}, total: ${state?.total}`);
      if (state?.images > 0) break;
    }
    
    // Also check the uploaded image URL if any were added to the server
    const result = await editFrame.evaluate(() => {
      const se = window.SmartEditor?.instance || window.SmartEditor?._editors?.blogpc001;
      if (!se) return null;
      const doc = se._documentService.getDocumentData();
      return doc.document.components.filter(c => c['@ctype'] === 'image')
        .map(c => ({ fn: c.fileName, src: (c.src || '').substring(0, 80), loaded: c.imageLoaded }));
    });
    
    console.log('최종 이미지 상태:', JSON.stringify(result, null, 2));

  } finally {
    await page.close();
  }
})();
