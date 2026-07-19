const { chromium } = require('playwright');
const fs = require('fs');
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
  
  console.log('URL:', page.url());
  
  // === Set title ===
  const titleText = '부동산 중개법인·공인중개사, 하반기 분양 마케팅은 숏폼 영상으로 준비하세요';
  await page.evaluate((t) => {
    SmartEditor._editors['blogpc001'].setDocumentTitle(t);
  }, titleText);
  console.log('✅ Title set');
  
  // === Read body content ===
  const bodyHtml = fs.readFileSync(path.join(__dirname, 'blog_realestate_body.html'), 'utf8');
  
  // === Method 1: Use setDocumentData first (stores data internally) ===
  await page.evaluate((html) => {
    SmartEditor._editors['blogpc001'].setDocumentData(html);
  }, bodyHtml);
  console.log('✅ setDocumentData done');
  
  // Check the data is stored
  let check1 = await page.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    return {
      docDataLen: (ed.getDocumentData() || '').length,
      contentLen: (ed.getContent() || '').length,
    };
  });
  console.log('After setDocumentData:', check1);
  
  // === Method 2: Try to use internal services to update the display ===
  await page.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    // Try to trigger state update
    if (ed._stateUpdateBroadcaster) {
      try {
        ed._stateUpdateBroadcaster.depostAutorunAsync();
      } catch(e) {}
    }
  });
  await page.waitForTimeout(1000);
  
  let check2 = await page.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const content = ed.getContent ? ed.getContent() : '';
    return {
      contentLen: content.length,
      hasHtml: content.length > 100,
      preview: content.replace(/<[^>]+>/g, '').slice(0, 50),
    };
  });
  console.log('After state update:', check2);
  
  await page.screenshot({ path: 'blog_insert_result.png', fullPage: false });
  console.log('Screenshot saved');
  
})();
