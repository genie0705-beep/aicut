const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = ctx.pages()[0] || await ctx.newPage();
  page.on('dialog', async d => d.dismiss());

  // 실시간 트렌드 페이지
  await page.goto('https://blokey.co.kr/trending', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(5000);
  
  console.log('=== 블로키 실시간 트렌드 ===\n');
  const text1 = await page.evaluate(() => document.body.innerText);
  console.log(text1.substring(0, 3000));
  
  console.log('\n\n=== 황금키워드 페이지 ===\n');
  await page.goto('https://blokey.co.kr/golden', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(5000);
  const text2 = await page.evaluate(() => document.body.innerText);
  console.log(text2.substring(0, 3000));
  
  console.log('\n=== 완료 ===');
})();
