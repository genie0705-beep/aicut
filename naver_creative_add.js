const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('ads.naver.com'));
  await sleep(500);

  // "전체 추가" 버튼 2개 (제목/설명) 클릭
  const r1 = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, span, a'));
    const allBtns = btns.filter(el => el.innerText?.trim() === '전체 추가');
    allBtns.forEach(btn => btn.click());
    return `전체 추가 클릭: ${allBtns.length}개`;
  });
  console.log(r1);
  await sleep(2000);

  await page.screenshot({ path: 'naver_creative_added.png' });

  // 스크롤 다운해서 아래 내용 확인
  await page.evaluate(() => {
    const modal = document.querySelector('[class*="modal"], [class*="dialog"]');
    if (modal) modal.scrollTop = 500;
    else window.scrollBy(0, 500);
  });
  await sleep(500);
  await page.screenshot({ path: 'naver_creative_added2.png' });

  // 저장 버튼 찾기
  const saveState = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.map(b => ({text: b.innerText?.trim(), disabled: b.disabled}))
      .filter(b => b.text && b.text.length < 20).slice(0, 20);
  });
  console.log('버튼 상태:', JSON.stringify(saveState));

  await b.close();
})().catch(e=>console.error(e.message))
.finally(()=>setTimeout(()=>process.exit(0),1000));
