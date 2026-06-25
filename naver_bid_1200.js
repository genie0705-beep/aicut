const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('ads.naver.com'));
  await sleep(500);

  // 첫 번째 라디오 선택 확인 (이미 "특정 금액으로 변경" 선택됨)
  // number 입력창에 1200 입력
  const numInput = await page.$('input[type="number"]');
  if (numInput) {
    const rect = await numInput.evaluate(el => {
      const r = el.getBoundingClientRect();
      return { y: r.y, visible: r.y > 0 && r.y < window.innerHeight };
    });
    console.log('number 입력창 visible:', rect.visible, 'y:', rect.y);

    if (rect.visible) {
      await numInput.click({ clickCount: 3 });
      await numInput.type('1200');
      console.log('입찰가 1200 입력');
    }
  }

  await sleep(500);
  await page.screenshot({ path: 'naver_bid_1200.png' });

  // "변경사항 미리보기" 클릭
  const previewBtn = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText?.includes('변경사항 미리보기'));
    if (btn) { btn.click(); return '미리보기 클릭'; }
    return '없음';
  });
  console.log(previewBtn);
  await sleep(2000);

  await page.screenshot({ path: 'naver_bid_preview.png' });

  // 미리보기 확인 후 변경 버튼
  const changeBtn = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText?.trim() === '변경');
    return btn ? { found: true, disabled: btn.disabled } : { found: false };
  });
  console.log('변경 버튼:', changeBtn);

  await b.close();
})().catch(e=>console.error(e.message))
.finally(()=>setTimeout(()=>process.exit(0),1000));
