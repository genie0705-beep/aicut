const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const context = browser.contexts()[0];
  
  // Grant clipboard permissions
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  
  let page = context.pages().find(p => p.url().includes('PostWriteForm'));
  if (!page) {
    page = await context.newPage();
    await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(3000);
  }
  console.log('URL:', page.url());
  
  // === 1. Title ===
  const title = '부동산 중개법인·공인중개사, 하반기 분양 마케팅은 숏폼 영상으로 준비하세요';
  await page.evaluate((t) => SmartEditor._editors['blogpc001'].setDocumentTitle(t), title);
  console.log('✅ Title set');
  
  // === 2. Set clipboard via navigator.clipboard API ===
  const bodyHtml = fs.readFileSync(path.join(__dirname, 'blog_realestate_body.html'), 'utf8');
  
  // Also include plain text version for compatibility  
  const plainText = bodyHtml.replace(/<[^>]+>/g, '').replace(/\n{3,}/g, '\n\n');
  
  await page.evaluate(async ({html, text}) => {
    try {
      const htmlBlob = new Blob([html], {type: 'text/html'});
      const textBlob = new Blob([text], {type: 'text/plain'});
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': htmlBlob,
          'text/plain': textBlob
        })
      ]);
    } catch(e) {
      throw new Error('clipboard write: ' + e.message);
    }
  }, { html: bodyHtml, text: plainText });
  console.log('✅ Clipboard set via API');
  await page.waitForTimeout(300);
  
  // === 3. Focus and paste ===
  await page.evaluate(() => {
    SmartEditor._editors['blogpc001']._canvasScrollingService.focusFirstText();
  });
  await page.waitForTimeout(500);
  
  await page.keyboard.press('Control+V');
  await page.waitForTimeout(3000);
  
  // === 4. Verify ===
  const check = await page.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData ? ed.getDocumentData() : null;
    const title = ed.getDocumentTitle();
    const html = typeof data === 'string' ? data : JSON.stringify(data);
    return {
      title,
      hasPTags: html.includes('<p'),
      hasH2: html.includes('<h2'),
      len: html.length,
    };
  });
  console.log('Result:', JSON.stringify(check));
  
  await page.screenshot({ path: 'blog_final_attempt.png', fullPage: false });
  console.log('Screenshot saved');
})();
