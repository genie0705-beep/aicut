const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[1];

  // 광고그룹 확인
  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await sleep(3000);
  const grpTxt = await page.evaluate(() => document.body.innerText.substring(0, 6000));
  console.log('=== 광고그룹 ===');
  console.log(grpTxt);

  await b.close();
})().catch(e => console.error(e.message.split('\n')[0]));
