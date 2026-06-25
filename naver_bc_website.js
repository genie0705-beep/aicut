const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const page = pages.find(p => p.url().includes('ads.naver.com'));
  await sleep(500);

  // "웹사이트" 옵션 클릭
  const r1 = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('li, a, button, span, div'));
    // 드롭다운 하단에 나타난 "웹사이트" 찾기
    const el = els.find(e => {
      const t = e.innerText?.trim();
      const r = e.getBoundingClientRect();
      return t === '웹사이트' && r.y > 500 && r.width > 50;
    });
    if (el) { el.click(); return '웹사이트 클릭'; }
    return '없음';
  });
  console.log(r1);
  await sleep(2000);

  console.log('URL:', page.url());
  await page.screenshot({ path: 'naver_bc_website.png' });

  const inputs = await page.evaluate(() =>
    Array.from(document.querySelectorAll('input, textarea'))
      .map(el => ({ ph: el.placeholder, val: el.value, maxLen: el.maxLength, type: el.type }))
      .filter(el => el.ph || el.val).slice(0, 10)
  );
  console.log('입력창:', JSON.stringify(inputs));

  await b.close();
})().catch(e => console.error(e.message))
.finally(() => setTimeout(() => process.exit(0), 1000));
