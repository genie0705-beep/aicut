const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('canva.com/design'));

  await sleep(1000);

  // ── STEP 1: 캔버스 배경 클릭 ──
  await page.mouse.click(620, 300); // 캔버스 중앙 클릭
  await sleep(1000);
  await page.screenshot({ path: 'canva_s1.png' });

  // 배경 선택 상태 확인
  const s1 = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button,[role="button"]'))
      .map(el => el.getAttribute('aria-label') || el.innerText?.trim().substring(0,30))
      .filter(t=>t&&t.length>1).slice(0,20);
    return btns;
  });
  console.log('STEP1 버튼:', s1);

  await b.close();
})().catch(e=>console.error(e.message))
.finally(()=>setTimeout(()=>process.exit(0),1000));
