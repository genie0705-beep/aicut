const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('canva.com/design'));

  await sleep(1000);

  // 캔버스 빈 영역 클릭 (배경 선택)
  // Canva 에디터에서 캔버스는 중앙 영역 (~400~900 x, ~100~700 y)
  await page.mouse.click(650, 400);
  console.log('캔버스 클릭');
  await sleep(1500);

  // 상단 툴바에 "배경색" 버튼 나타나는지 확인
  const toolbar = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button,[role="button"]'));
    return btns
      .map(el => ({ label: el.getAttribute('aria-label'), text: el.innerText?.trim().substring(0,30) }))
      .filter(el => el.label || el.text)
      .filter(el => (el.label||'').includes('배경') || (el.text||'').includes('배경') || (el.label||'').includes('색') || (el.label||'').includes('색상'))
      .slice(0,5);
  });
  console.log('배경색 버튼:', JSON.stringify(toolbar));

  // 전체 visible 버튼 확인
  const allBtns = await page.evaluate(() =>
    Array.from(document.querySelectorAll('button,[role="button"]'))
      .map(el => el.getAttribute('aria-label') || el.innerText?.trim().substring(0,25))
      .filter(t=>t&&t.length>1).slice(0,30)
  );
  console.log('전체 버튼:', allBtns);

  await b.close();
})().catch(e=>console.error(e.message))
.finally(()=>setTimeout(()=>process.exit(0),1000));
