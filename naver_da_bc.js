const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const page = pages.find(p => p.url().includes('ads.naver.com'));
  await sleep(500);

  // DA 비즈채널 관리 페이지 직접 이동
  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/da/biz-channels', { waitUntil:'domcontentloaded', timeout:20000 }).catch(()=>{});
  await sleep(3000);

  console.log('URL:', page.url());
  await page.screenshot({ path: 'naver_da_bc_list.png' });

  const text = await page.evaluate(() => document.body.innerText.substring(0, 1500));
  console.log(text);

  await b.close();
})().catch(e => console.error(e.message))
.finally(() => setTimeout(() => process.exit(0), 1000));
