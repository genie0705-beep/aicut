const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('ads.naver.com'));
  await sleep(500);

  // 모달 내 드롭다운 위치 정확히 파악 (x: 320~860 범위)
  const dropdownPos = await page.evaluate(() => {
    const modal = document.querySelector('.ad-cms-modal-wrap, [class*="modal-wrap"], [class*="modal-centered"]');
    if (!modal) return null;
    
    // 모달 내 드롭다운 버튼 (선택 안 함 텍스트 포함)
    const allEls = Array.from(modal.querySelectorAll('*'));
    const el = allEls.find(el => {
      const t = el.innerText?.trim();
      return t === '선택 안 함' || (t && t.includes('선택 안 함') && el.children.length < 3);
    });
    if (el) {
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2), tag: el.tagName, cls: el.className.substring(0,40) };
    }

    // 모달 내 모든 클릭 가능한 요소
    const clickables = allEls.filter(el => {
      const r = el.getBoundingClientRect();
      return r.width > 100 && r.height > 30 && r.height < 60 && r.x > 320 && r.x < 700;
    }).map(el => {
      const r = el.getBoundingClientRect();
      return { text: el.innerText?.trim().substring(0,20), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), tag: el.tagName };
    }).filter(el => el.text).slice(0, 10);
    return { dropdowns: clickables };
  });
  console.log('드롭다운:', JSON.stringify(dropdownPos));

  await b.close();
})().catch(e=>console.error(e.message))
.finally(()=>setTimeout(()=>process.exit(0),1000));
