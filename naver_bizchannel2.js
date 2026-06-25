const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const page = pages.find(p => p.url().includes('ads.naver.com'));

  // 구성요소 관리 → 비즈채널
  await page.goto('https://manage.searchad.naver.com/biz-channels', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(()=>{});
  await sleep(3000);

  let text = await page.evaluate(() => document.body.innerText.substring(0, 1000));
  console.log('URL:', page.url());
  console.log(text);
  await page.screenshot({ path: 'naver_bizchannel2.png' });

  await b.close();
})().catch(e => console.error(e.message))
.finally(() => setTimeout(() => process.exit(0), 1000));
