const { chromium } = require('playwright');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page = pages.find(p => p.url().includes('miricanvas.com') && p.url().includes('design'));

  await sleep(1000);

  // "직접 입력" 클릭 → 커스텀 사이즈 설정
  const clicked = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('button, [role="button"], li, div, span, a'));
    const target = els.find(el => (el.innerText || '').trim() === '직접 입력');
    if (target) { target.click(); return '직접 입력 클릭'; }
    // 카드뉴스 클릭 시도
    const cardBtn = els.find(el => (el.innerText || '').trim().includes('카드뉴스'));
    if (cardBtn) { cardBtn.click(); return '카드뉴스 클릭'; }
    return '없음';
  });
  console.log(clicked);
  await sleep(2000);

  await page.screenshot({ path: 'miri_after_click.png' });
  console.log('스크린샷 저장');

  await b.close();
})().catch(e => console.error('Error:', e.message))
.finally(() => setTimeout(() => process.exit(0), 1000));
