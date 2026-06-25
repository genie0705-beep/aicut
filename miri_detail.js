const { chromium } = require('playwright');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page = pages.find(p => p.url().includes('miricanvas.com') && p.url().includes('design'));

  await sleep(1000);

  // 에디터 메인 영역 상세 파악
  const detail = await page.evaluate(() => {
    // iframe 있는지
    const iframes = Array.from(document.querySelectorAll('iframe')).map(f => ({ src: f.src, id: f.id, cls: f.className.substring(0,40) }));
    
    // 클릭 가능한 캔버스 영역
    const svgs = Array.from(document.querySelectorAll('svg')).slice(0, 5).map(s => ({ cls: s.className?.baseVal?.substring(0,40), w: s.getAttribute('width'), h: s.getAttribute('height') }));
    
    // 텍스트 추가 관련 버튼
    const addTextBtns = Array.from(document.querySelectorAll('button, [role="button"], [class*="text"]'))
      .filter(el => {
        const t = (el.innerText || el.textContent || '').trim();
        return t.includes('텍스트') || t.includes('제목') || t.includes('본문') || t.includes('추가');
      })
      .map(el => ({ tag: el.tagName, text: (el.innerText||'').trim().substring(0,40), cls: el.className.substring(0,50) }))
      .slice(0, 15);

    return { iframes: iframes.slice(0,5), svgs, addTextBtns };
  });
  
  console.log('iframes:', JSON.stringify(detail.iframes));
  console.log('SVGs:', JSON.stringify(detail.svgs));
  console.log('텍스트 관련 요소:', JSON.stringify(detail.addTextBtns));

  await b.close();
})().catch(e => console.error('Error:', e.message))
.finally(() => setTimeout(() => process.exit(0), 1000));
