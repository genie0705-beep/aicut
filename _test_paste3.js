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
    await sleep(1000);

    // SE4 focus to last component
    console.log('SE4 focus...');
    const focusResult = await editFrame.evaluate(() => {
      const se = window.SmartEditor?.instance || window.SmartEditor?._editors?.blogpc001;
      if (!se) return { error: 'no SE' };
      
      try {
        // Method 1: focusToLastComp
        if (se._canvasScrollingService?.focusToLastComp) {
          se._canvasScrollingService.focusToLastComp();
          return { method: 'focusToLastComp' };
        }
        // Method 2: focusToFirstComp and move
        if (se._canvasScrollingService?.focusToFirstComp) {
          se._canvasScrollingService.focusToFirstComp();
          return { method: 'focusToFirstComp' };
        }
        // Method 3: select the last text paragraph
        const lastPara = document.querySelector('.se-text-paragraph:last-child');
        if (lastPara) {
          const range = document.createRange();
          const sel = window.getSelection();
          range.selectNodeContents(lastPara);
          range.collapse(false); // end of node
          sel.removeAllRanges();
          sel.addRange(range);
          return { method: 'selection', text: lastPara.innerText?.substring(0, 30) };
        }
        return { error: 'no method worked' };
      } catch(e) {
        return { error: e.message };
      }
    });
    console.log('Focus:', JSON.stringify(focusResult));
    await sleep(500);
    
    // Now try filechooser approach with cursor properly positioned
    const imagePath = path.resolve(__dirname, 'aicut_blog_dental_main.png');
    
    const fcPromise = page.waitForEvent('filechooser', { timeout: 10000 });
    await editFrame.click('button.se-image-toolbar-button');
    const fc = await fcPromise;
    
    if (fc) {
      console.log('✅ filechooser captured');
      await fc.setFiles([imagePath]);
      console.log('✅ files set');
      
      for (let i = 0; i < 10; i++) {
        await sleep(2000);
        const state = await editFrame.evaluate(() => {
          const se = window.SmartEditor?.instance || window.SmartEditor?._editors?.blogpc001;
          if (!se) return null;
          const doc = se._documentService.getDocumentData();
          return {
            images: doc.document.components.filter(c => c['@ctype'] === 'image').length,
            total: doc.document.components.length,
            comps: doc.document.components.slice(-2).map(c => ({ type: c['@ctype'], fn: c.fileName })),
          };
        });
        console.log(`  [${i+1}] ${JSON.stringify(state)}`);
        if (state?.images > 0) break;
      }
    }

  } finally {
    await page.close();
  }
})();
