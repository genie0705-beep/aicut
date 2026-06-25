const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const pages = b.contexts()[0].pages();
  let page;
  for (const p of pages) { if (p.url().includes('PostWriteForm')) { page = p; break; } }
  if (!page) { console.log('no editor'); process.exit(1); }
  
  await page.bringToFront();
  await page.waitForTimeout(1500);
  
  // 현재 이미지 상태 캡처
  await page.screenshot({ path: 'img_before_fix.png' });
  
  // 이미지 컴포넌트 상세 분석
  const imgInfo = await page.evaluate(() => {
    const wrap = document.querySelector('.se-components-wrap');
    const imgs = wrap ? wrap.querySelectorAll('img') : [];
    const result = [];
    
    imgs.forEach((img, i) => {
      const rect = img.getBoundingClientRect();
      // 이미지의 부모 chain 분석
      let el = img;
      const chain = [];
      for (let d = 0; d < 6; d++) {
        if (!el) break;
        const r = el.getBoundingClientRect();
        const compType = el.classList?.contains('se-component') ? 'COMPONENT' :
                         el.classList?.contains('se-section') ? 'SECTION' :
                         el.classList?.contains('se-module') ? 'MODULE' : 'OTHER';
        
        // 정렬 관련 속성들
        const align = window.getComputedStyle(el).textAlign;
        const margin = window.getComputedStyle(el).margin;
        const display = window.getComputedStyle(el).display;
        const float = window.getComputedStyle(el).float;
        
        chain.push({
          tag: el.tagName,
          type: compType,
          cls: (el.className || '').substring(0, 40),
          textAlign: align,
          margin: margin,
          display: display,
          float: float,
          w: Math.round(r.width),
          x: Math.round(r.x)
        });
        el = el.parentElement;
      }
      
      result.push({
        imgIndex: i,
        imgRect: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width) },
        alt: img.alt || '',
        chain: chain
      });
    });
    
    return result;
  });
  
  console.log('=== 이미지 정렬 상태 ===');
  console.log(JSON.stringify(imgInfo, null, 2));
  
  await b.close();
})();
