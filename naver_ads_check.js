const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const page = pages[1];

  // 현재 URL 확인
  console.log('현재 URL:', page.url());

  // 대시보드로 이동
  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/dashboard', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await sleep(3000);
  
  const dashText = await page.evaluate(() => document.body.innerText.substring(0, 3000));
  console.log('=== 대시보드 ===');
  console.log(dashText);

  await b.close();
})().catch(e => console.error(e.message.split('\n')[0]));
