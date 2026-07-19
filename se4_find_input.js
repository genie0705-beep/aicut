const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  
  // Redirect=Write 페이지 찾기
  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('Redirect=Write') || p.url().includes('PostWriteForm')) {
      page = p; break;
    }
  }
  if (!page) { 
    page = ctx.pages()[0]; 
    await page.goto('https://blog.naver.com/aicut?Redirect=Write&', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(3000);
  }

  // 전체 페이지에서 file input 찾기
  const inputInfo = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input[type="file"]');
    return Array.from(inputs).map((inp, i) => ({
      i, id: inp.id, name: inp.name, className: inp.className,
      hidden: inp.type === 'hidden' || inp.style.display === 'none',
      parent: inp.parentElement?.tagName || 'none',
      rect: (() => { try { const r = inp.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; } catch(e) { return {}; } })()
    }));
  });
  console.log('Main page file inputs:', JSON.stringify(inputInfo));

  // iframe 안에서 file input 찾기
  const frames = page.frames();
  console.log(`\nTotal frames: ${frames.length}`);
  
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    try {
      const fInputs = await f.evaluate(() => {
        const inputs = document.querySelectorAll('input[type="file"]');
        return Array.from(inputs).map((inp, j) => ({
          j, id: inp.id, name: inp.name, className: inp.className,
          hidden: inp.style.display === 'none',
          accept: inp.accept
        }));
      });
      if (fInputs.length > 0) {
        console.log(`\nFrame ${i} file inputs:`, JSON.stringify(fInputs));
      }
      
      const hasSE = await f.evaluate(() => typeof SmartEditor !== 'undefined');
      if (hasSE) {
        console.log(`\nFrame ${i} SmartEditor found!`);
        
        // 사진 버튼 정보
        const btnInfo = await f.evaluate(() => {
          const btns = document.querySelectorAll('button');
          const photoBtns = [];
          btns.forEach(btn => {
            const text = btn.innerText.trim();
            if (text === '사진' || text.includes('사진')) {
              const rect = btn.getBoundingClientRect();
              photoBtns.push({ text, tag: btn.tagName, visible: rect.width > 0 && rect.height > 0, rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height } });
            }
          });
          return photoBtns;
        });
        console.log('Photo buttons:', JSON.stringify(btnInfo));
      }
    } catch(e) {}
  }

  console.log('\n=== 완료 ===');
})();
