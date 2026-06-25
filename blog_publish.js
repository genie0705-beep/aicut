// 블로그 발행 버튼 클릭
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];

  // postwrite 탭 찾기
  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('postwrite')) {
      page = p;
      break;
    }
  }

  if (!page) {
    console.log('에디터 탭 없음');
    try { await b.close(); } catch(e) {}
    process.exit(1);
  }

  // 발행 버튼 찾기
  const btns = await page.$$('button');
  for (const btn of btns) {
    const txt = await btn.innerText().catch(() => '');
    if (txt.trim() === '발행') {
      const vis = await btn.isVisible().catch(() => false);
      if (vis) {
        console.log('발행 버튼 클릭');
        await btn.click({ force: true }).catch(() => {});
        await page.waitForTimeout(3000);
        console.log('발행 완료!');
        break;
      }
    }
  }

  // 발행 후 URL 확인
  console.log('현재 URL:', page.url());

  try { await b.close(); } catch(e) {}
})();
