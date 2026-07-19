const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const context = browser.contexts()[0];
  let page = context.pages().find(p => p.url().includes('PostWriteForm'));
  
  if (!page) {
    console.log('PostWriteForm page not found');
    return;
  }
  
  // Check current state
  const state = await page.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData ? ed.getDocumentData() : {};
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
    return {
      title: ed.getDocumentTitle(),
      dataLength: dataStr.length,
      hasContent: dataStr.length > 200,
    };
  });
  console.log('Current state:', JSON.stringify(state));
  
  // If content is empty, we need to paste again
  if (!state.hasContent) {
    console.log('Content empty - need to paste again');
    
    // Read v3 body
    const fs = require('fs');
    const path = require('path');
    const bodyHtml = fs.readFileSync(path.join(__dirname, 'blog_realestate_body_v3.html'), 'utf8');
    
    // Set clipboard via navigator API  
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const plainText = bodyHtml.replace(/<[^>]+>/g, '').replace(/\n{3,}/g, '\n\n');
    
    await page.evaluate(async ({html, text}) => {
      const htmlBlob = new Blob([html], {type: 'text/html'});
      const textBlob = new Blob([text], {type: 'text/plain'});
      await navigator.clipboard.write([
        new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob })
      ]);
    }, { html: bodyHtml, text: plainText });
    console.log('✅ Clipboard set');
    await page.waitForTimeout(500);
    
    // Focus and paste
    await page.evaluate(() => {
      SmartEditor._editors['blogpc001']._canvasScrollingService.focusFirstText();
    });
    await page.waitForTimeout(300);
    await page.keyboard.press('Control+A');
    await page.waitForTimeout(300);
    await page.keyboard.press('Control+V');
    await page.waitForTimeout(2000);
    
    const afterState = await page.evaluate(() => {
      const ed = SmartEditor._editors['blogpc001'];
      const data = ed.getDocumentData ? ed.getDocumentData() : {};
      const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
      return { dataLength: dataStr.length, hasContent: dataStr.length > 200 };
    });
    console.log('After paste:', JSON.stringify(afterState));
  }
  
  // Save
  const saveResult = await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const b of btns) {
      if (b.innerText.trim() === '저장' || b.innerText.includes('저장')) {
        b.click();
        return 'clicked: ' + b.innerText.trim();
      }
    }
    return 'not found';
  });
  console.log('Save button:', saveResult);
  await page.waitForTimeout(3000);
  
  console.log('\n✅ 완료! 본문 교체 + 저장됨');
})();
