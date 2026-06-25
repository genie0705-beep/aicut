const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const page = pages.find(p => p.url().includes('ads.naver.com'));
  await sleep(500);

  // 비즈채널 클릭
  const r = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('li, a, span'));
    const el = els.find(e => e.innerText?.trim() === '비즈채널');
    if (el) { el.click(); return '비즈채널 클릭'; }
    return '없음';
  });
  console.log(r);
  await sleep(3000);

  console.log('URL:', page.url());
  const text = await page.evaluate(() => document.body.innerText.substring(0, 2000));
  console.log(text);
  await page.screenshot({ path: 'naver_bizchannel_list.png' });

  await b.close();
})().catch(e => console.error(e.message))
.finally(() => setTimeout(() => process.exit(0), 1000));
