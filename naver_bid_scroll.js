const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('ads.naver.com'));
  await sleep(500);

  // 페이지 맨 위로 스크롤
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(800);

  // "입찰가 변경" 버튼 위치 재확인
  const bidBtnPos = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText?.includes('입찰가 변경'));
    if (btn) {
      const r = btn.getBoundingClientRect();
      return { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2), disabled: btn.disabled };
    }
    return null;
  });
  console.log('입찰가 변경 버튼 위치:', bidBtnPos);

  if (bidBtnPos && bidBtnPos.y > 0) {
    await page.mouse.click(bidBtnPos.x, bidBtnPos.y);
    console.log('클릭!');
    await sleep(2500);

    await page.screenshot({ path: 'naver_bid_modal3.png' });

    // 모달 내 입력창 확인
    const modalInputs = await page.evaluate(() => {
      const allInputs = Array.from(document.querySelectorAll('input[type="radio"], input[type="number"], input[type="text"]'));
      const modal = document.querySelector('[class*="modal"], [class*="dialog"]');
      const target = modal || document;
      return Array.from(target.querySelectorAll('input, label')).map(el => ({
        tag: el.tagName,
        type: el.type,
        ph: el.placeholder,
        val: el.value,
        text: el.innerText?.trim()?.substring(0,20),
        maxLen: el.maxLength
      })).filter(el => el.ph || el.text || el.type === 'radio').slice(0,15);
    });
    console.log('모달 입력:', JSON.stringify(modalInputs, null, 2));
  }

  await b.close();
})().catch(e=>console.error(e.message))
.finally(()=>setTimeout(()=>process.exit(0),1000));
