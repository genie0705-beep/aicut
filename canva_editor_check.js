const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// 카드 1 Summary 내용
// 배경: #0D1630 (다크 네이비)
// 태그: 고객사례 · 부동산 중개법인
// 헤드라인: 매물 영상, / 올리고 싶은 만큼 / 올리게 됐어요.
// KPI: 월 20편 정시 납품 | 주 14h→2h | 구독자 3배

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('canva.com/design'));
  if (!page) {
    console.log('에디터 탭 없음');
    await b.close(); return;
  }

  console.log('에디터 URL:', page.url());
  await sleep(4000); // 에디터 완전 로딩 대기
  await page.screenshot({ path: 'canva_editor_loaded.png' });

  // 현재 에디터 상태 파악
  const state = await page.evaluate(() => ({
    btns: Array.from(document.querySelectorAll('button,[role="button"]'))
      .map(el => el.getAttribute('aria-label') || el.innerText?.trim().substring(0,30))
      .filter(t=>t && t.length > 1).slice(0,25),
    inputs: Array.from(document.querySelectorAll('input')).map(i=>i.placeholder).filter(t=>t).slice(0,5)
  }));
  console.log('에디터 버튼:', state.btns);

  await b.close();
})().catch(e=>console.error(e.message))
.finally(()=>setTimeout(()=>process.exit(0),1000));
