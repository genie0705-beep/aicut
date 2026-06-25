const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const context = browser.contexts()[0];
  const page = await context.newPage();
  
  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/tool/analytics', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  console.log('URL:', page.url());
  
  const text = await page.evaluate(() => document.body?.innerText || '');
  console.log('===== 전환추적 페이지 =====');
  console.log(text.substring(0, 4000));
  
  await page.close();
  await browser.close();
})().catch(e => { console.error('에러:', e.message); process.exit(1); });
