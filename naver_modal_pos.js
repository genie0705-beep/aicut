const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('ads.naver.com'));
  await sleep(500);

  await page.screenshot({ path: 'naver_modal_now.png' });

  // 모달 내 실제 드롭다운 버튼 위치 파악
  const pos = await page.evaluate(() => {
    const modal = document.querySelector('.ad-cms-modal.css-19gk9y7') ||
                  document.querySelector('[class*="ad-cms-modal"]');
    if (!modal) return { modal: false };

    const rect = modal.getBoundingClientRect();
    
    // 모달 내 클릭 가능한 드롭다운 버튼 찾기
    const allInModal = Array.from(modal.querySelectorAll('*'));
    const dropdown = allInModal.find(el => {
      const t = el.innerText?.trim();
      const r = el.getBoundingClientRect();
      return t && t.includes('선택') && r.width > 100 && r.height > 20 && r.height < 60;
    });

    if (dropdown) {
      const r = dropdown.getBoundingClientRect();
      return {
        modal: true,
        modalRect: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
        dropdown: { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2), text: dropdown.innerText?.trim().substring(0,20), tag: dropdown.tagName, cls: dropdown.className.substring(0,50) }
      };
    }
    return { modal: true, modalRect: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width) } };
  });
  console.log('모달 위치:', JSON.stringify(pos));

  await b.close();
})().catch(e=>console.error(e.message))
.finally(()=>setTimeout(()=>process.exit(0),1000));
