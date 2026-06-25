const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const page = pages.find(p => p.url().includes('ads.naver.com'));
  await sleep(500);

  // 상단 "디스플레이 광고" 탭 좌표로 클릭 (스크린샷 기준 ~ x=260, y=237)
  const tabPos = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('button, a, li, span, div'));
    const el = els.find(e => {
      const t = e.innerText?.trim();
      const r = e.getBoundingClientRect();
      return t === '디스플레이 광고' && r.y < 300 && r.width > 50;
    });
    if (el) {
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2), tag: el.tagName };
    }
    return null;
  });
  console.log('DA 탭 위치:', tabPos);

  if (tabPos) {
    await page.mouse.click(tabPos.x, tabPos.y);
    await sleep(2000);
    console.log('URL:', page.url());
    await page.screenshot({ path: 'naver_da_page.png' });
    const text = await page.evaluate(() => document.body.innerText.substring(0, 800));
    console.log(text);
  }

  await b.close();
})().catch(e => console.error(e.message))
.finally(() => setTimeout(() => process.exit(0), 1000));
