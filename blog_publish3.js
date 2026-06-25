// 발행 - 팝업 dismiss 후 클릭
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];

  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('postwrite')) { page = p; break; }
  }
  if (!page) { console.log('에디터 탭 없음'); process.exit(1); }

  // dialog 자동 처리
  ctx.on('dialog', async d => { try { await d.accept(); } catch(e) {} });

  // 모든 발행 버튼 찾기
  const allBtns = await page.$$('button');
  console.log('=== 발행 버튼 검색 ===');
  for (const btn of allBtns) {
    const txt = await btn.innerText().catch(() => '');
    const vis = await btn.isVisible().catch(() => false);
    if (txt.trim() === '발행') {
      console.log(`발행 버튼: visible=${vis}`);
      if (vis) {
        await btn.click({ force: true });
        await page.waitForTimeout(2000);
      }
    }
  }

  await page.waitForTimeout(2000);

  // 발행 후 상태
  console.log('URL:', page.url());
  const body = await page.evaluate(() => {
    const alerts = document.querySelectorAll('[class*="alert"], [class*="toast"], [class*="message"]');
    const texts = Array.from(alerts).map(el => el.innerText).filter(t => t);
    return texts.length > 0 ? texts.join(' | ') : document.body.innerText.substring(0, 300);
  }).catch(() => '');
  console.log('상태:', body);

  try { await b.close(); } catch(e) {}
})();
