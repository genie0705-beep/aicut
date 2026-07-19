const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const context = browser.contexts()[0];
  let page = context.pages().find(p => p.url().includes('PostWriteForm'));
  if (!page) {
    page = await context.newPage();
    await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(3000);
  }
  
  // Test with minimal HTML
  const testHtml = '<p style="text-align: center;">테스트 문단입니다.</p>';
  
  const result = await page.evaluate((html) => {
    try {
      SmartEditor._editors['blogpc001'].setDocumentData(html);
      return 'success';
    } catch(e) {
      return 'error: ' + e.message;
    }
  }, testHtml);
  console.log('Minimal setDocumentData:', result);
  
  // Check content
  const check = await page.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    return {
      dataLen: (ed.getDocumentData() || '').length,
      contentLen: (ed.getContent() || '').length,
    };
  });
  console.log('Content:', check);
  
  // Test with slightly more HTML
  const testHtml2 = '<p style="text-align: center;">첫 문단입니다.</p><p style="text-align: center;"><strong>굵은 글씨</strong></p><h2 style="text-align: center;">제목</h2>';
  
  const result2 = await page.evaluate((html) => {
    try {
      SmartEditor._editors['blogpc001'].setDocumentData(html);
      return 'success';
    } catch(e) {
      return 'error: ' + e.message;
    }
  }, testHtml2);
  console.log('\nExtended setDocumentData:', result2);
  
  const check2 = await page.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    return {
      dataLen: (ed.getDocumentData() || '').length,
      contentLen: (ed.getContent() || '').length,
    };
  });
  console.log('Content:', check2);
})();
