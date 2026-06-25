// 발행 - 모달 안의 발행 버튼 찾기
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];

  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('postwrite')) { page = p; break; }
  }
  if (!page) { console.log('에디터 탭 없음'); process.exit(1); }

  ctx.on('dialog', async d => { try { await d.accept(); } catch(e) {} });

  // 1) 먼저 발행 버튼 클릭 (모달 열기)
  const btns = await page.$$('button');
  for (const btn of btns) {
    const txt = await btn.innerText().catch(() => '');
    const vis = await btn.isVisible().catch(() => false);
    if (txt.trim() === '발행') {
      console.log(`발행(1) visible=${vis}`);
      if (vis) {
        await btn.click({ force: true });
        await page.waitForTimeout(2000);
        break;
      }
    }
  }

  // 2) 모달 안의 발행 버튼 찾기
  console.log('\n=== 모달 내 발행 버튼 검색 ===');
  const allBtns2 = await page.$$('button');
  for (const btn of allBtns2) {
    const txt = await btn.innerText().catch(() => '');
    const vis = await btn.isVisible().catch(() => false);
    const cls = await btn.getAttribute('class').catch(() => '');
    if (vis && (txt.trim() === '발행' || txt.includes('발행'))) {
      console.log(`발행(2): class="${cls?.substring(0, 50)}" text="${txt.trim()}"`);
    }
  }

  // 발행 버튼이 여러 개면, 두 번째 것 클릭
  const publishBtns = [];
  for (const btn of allBtns2) {
    const txt = await btn.innerText().catch(() => '');
    const vis = await btn.isVisible().catch(() => false);
    if (vis && txt.trim() === '발행') {
      publishBtns.push(btn);
    }
  }
  
  console.log(`발행 버튼 총 ${publishBtns.length}개`);
  if (publishBtns.length >= 2) {
    console.log('두 번째 발행 버튼 클릭');
    await publishBtns[1].click({ force: true });
    await page.waitForTimeout(3000);
    console.log('발행 완료!');
  } else if (publishBtns.length === 1 && false) {
    // 이미 첫 번째가 클릭됐으면...
  }

  console.log('URL:', page.url());
  const body = await page.evaluate(() => document.body.innerText.substring(0, 400)).catch(() => '');
  console.log('상태:', body);

  try { await b.close(); } catch(e) {}
})();
