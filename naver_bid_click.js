const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('ads.naver.com'));
  await sleep(500);

  // "입찰가 변경" 버튼 위치 찾기
  const bidBtnPos = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText?.includes('입찰가 변경'));
    if (btn) {
      const r = btn.getBoundingClientRect();
      return { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2), disabled: btn.disabled, text: btn.innerText.trim() };
    }
    return null;
  });
  console.log('입찰가 변경 버튼:', bidBtnPos);

  if (bidBtnPos) {
    // 좌표로 직접 클릭
    await page.mouse.click(bidBtnPos.x, bidBtnPos.y);
    console.log('클릭!');
    await sleep(2000);

    await page.screenshot({ path: 'naver_bid_modal2.png' });

    // 모달 확인
    const modal = await page.evaluate(() => {
      const m = document.querySelector('[class*="modal"], [class*="dialog"], [class*="popup"]');
      return m ? { found: true, text: m.innerText?.substring(0,300) } : { found: false };
    });
    console.log('모달:', modal);

    // 모달 없으면 드롭다운 방식
    if (!modal.found) {
      // 드롭다운으로 열리는지 확인
      const dropdown = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('li, [role="menuitem"]'));
        return items.filter(el => {
          const r = el.getBoundingClientRect();
          return r.y > 0 && r.y < window.innerHeight && el.innerText?.trim();
        }).map(el => ({ text: el.innerText.trim(), y: Math.round(el.getBoundingClientRect().y) })).slice(0, 10);
      });
      console.log('드롭다운:', JSON.stringify(dropdown));
    }
  }

  await b.close();
})().catch(e=>console.error(e.message))
.finally(()=>setTimeout(()=>process.exit(0),1000));
