const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const page = pages.find(p => p.url().includes('ads.naver.com'));
  await sleep(500);

  // 디스플레이 광고 탭 클릭
  const r1 = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, a, span, li'));
    const btn = btns.find(el => el.innerText?.trim() === '디스플레이 광고');
    if (btn) { btn.click(); return '디스플레이 광고 클릭'; }
    return '없음';
  });
  console.log(r1);
  await sleep(2000);

  console.log('URL:', page.url());
  await page.screenshot({ path: 'naver_da_tab.png' });

  const text = await page.evaluate(() => document.body.innerText.substring(0, 1500));
  console.log(text);

  await b.close();
})().catch(e => console.error(e.message))
.finally(() => setTimeout(() => process.exit(0), 1000));
