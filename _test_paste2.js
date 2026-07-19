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
    
    console.log('클립보드 paste 테스트...');
    const imagePath = path.resolve(__dirname, 'aicut_blog_dental_main.png');
    const imageBuf = fs.readFileSync(imagePath);
    const b64 = imageBuf.toString('base64');
    const mime = 'image/png';

    // Navigate clipboard API in the editor iframe
    const clipResult = await editFrame.evaluate(async ({ b64, mime }) => {
      try {
        const resp = await fetch(`data:${mime};base64,${b64}`);
        const blob = await resp.blob();
        const item = new ClipboardItem({ [mime]: blob });
        await navigator.clipboard.write([item]);
        return { success: true };
      } catch(e) {
        return { success: false, error: e.message };
      }
    }, { b64, mime });
    
    console.log('클립보드 기록:', JSON.stringify(clipResult));
    await sleep(1000);
    
    // Focus on a text paragraph in the editor
    const focusResult = await editFrame.evaluate(() => {
      const se = window.SmartEditor?.instance || window.SmartEditor?._editors?.blogpc001;
      if (!se) return { error: 'no SE' };
      
      // Find the last text paragraph and click it
      const lastPara = document.querySelector('.se-text-paragraph:last-child');
      if (lastPara) {
        // Create click event
        lastPara.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        return { focused: true, text: lastPara.innerText?.substring(0, 40) };
      }
      // Try contenteditable area
      const editable = document.querySelector('[contenteditable]');
      if (editable) {
        editable.focus();
        return { focused: true, editable: true };
      }
      
      return { error: 'no editable element found' };
    });
    
    console.log('포커스:', JSON.stringify(focusResult));
    await sleep(1000);
    
    // Press Ctrl+V at the page level (must use page.keyboard, not frame.keyboard)
    await page.keyboard.press('Control+v');
    console.log('✅ Ctrl+V executed');
    
    await sleep(5000);
    
    // Check for new image
    const docState = await editFrame.evaluate(() => {
      const se = window.SmartEditor?.instance || window.SmartEditor?._editors?.blogpc001;
      if (!se) return null;
      const doc = se._documentService.getDocumentData();
      const comps = doc.document.components;
      return {
        total: comps.length,
        images: comps.filter(c => c['@ctype'] === 'image').length,
        texts: comps.filter(c => c['@ctype'] === 'text').length,
        imageNames: comps.filter(c => c['@ctype'] === 'image').map(c => c.fileName || c.src?.substring(0, 60)),
      };
    });
    
    console.log('문서 상태:', JSON.stringify(docState, null, 2));
    
  } finally {
    await page.close();
  }
})();
