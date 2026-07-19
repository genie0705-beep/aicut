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

    console.log('DataTransfer 방식 테스트...');
    const imagePath = path.resolve(__dirname, 'aicut_blog_dental_main.png');

    // 방법 A: filechooser from hidden-file input directly
    // Trigger the hidden file input directly
    console.log('방법 A: hidden file input 직접 트리거...');
    
    const fcPromise = page.waitForEvent('filechooser', { timeout: 10000 }).catch(e => {
      console.log('  filechooser error:', e.message);
      return null;
    });
    
    // Click on the image toolbar button again
    await editFrame.click('button.se-image-toolbar-button');
    const fc = await fcPromise;
    
    if (fc) {
      console.log('  ✅ filechooser captured');
      await fc.setFiles([imagePath]);
      console.log('  ✅ files set');
      
      // Wait longer for upload to complete and SE4 to add component
      for (let i = 0; i < 15; i++) {
        await sleep(2000);
        const imgCount = await editFrame.evaluate(() => {
          const se = window.SmartEditor?.instance || window.SmartEditor?._editors?.blogpc001;
          if (!se) return -1;
          const doc = se._documentService.getDocumentData();
          return {
            images: doc.document.components.filter(c => c['@ctype'] === 'image').length,
            total: doc.document.components.length,
            comps: doc.document.components.slice(-2).map(c => ({ type: c['@ctype'], fn: c.fileName, loaded: c.imageLoaded }))
          };
        });
        console.log(`  [${i+1}] 상태:`, JSON.stringify(imgCount));
        if (imgCount.images > 0) break;
      }
    } else {
      console.log('  ❌ filechooser not captured');
    }

  } finally {
    await page.close();
  }
})();
