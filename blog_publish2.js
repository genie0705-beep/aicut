// 발행 설정 모달에서 발행 버튼 클릭
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];

  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('postwrite')) { page = p; break; }
  }
  if (!page) { console.log('에디터 탭 없음'); process.exit(1); }

  // 모든 버튼에서 "발행" 찾기
  const btns = await page.$$('button');
  for (const btn of btns) {
    const txt = await btn.innerText().catch(() => '');
    const vis = await btn.isVisible().catch(() => false);
    if (txt.trim() === '발행' && vis) {
      console.log('발행 버튼 클릭 (설정 모달)');
      await btn.click({ force: true }).catch(() => {});
      await page.waitForTimeout(3000);
      console.log('발행 완료!');
      break;
    }
  }

  console.log('URL:', page.url());

  try { await b.close(); } catch(e) {}
})();
