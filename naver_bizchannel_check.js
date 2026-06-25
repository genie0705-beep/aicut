const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const page = pages.find(p => p.url().includes('ads.naver.com'));

  // 비즈채널 확인 페이지로 이동
  await page.goto('https://manage.searchad.naver.com/bizChannel/list', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(()=>{});
  await sleep(3000);

  await page.screenshot({ path: 'naver_bizchannel.png' });
  const text = await page.evaluate(() => document.body.innerText.substring(0, 2000));
  console.log(text);

  await b.close();
})().catch(e => console.error(e.message))
.finally(() => setTimeout(() => process.exit(0), 1000));
