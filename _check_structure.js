const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const pages = b.contexts()[0].pages();
  let page;
  for (const p of pages) { if (p.url().includes('PostWriteForm')) { page = p; break; } }
  if (!page) { console.log('no editor'); process.exit(1); }
  
  await page.bringToFront();
  await page.waitForTimeout(1000);
  
  // 현재 에디터 구조 분석
  const structure = await page.evaluate(() => {
    const wrap = document.querySelector('.se-components-wrap');
    if (!wrap) return { error: 'no wrap' };
    
    const text = wrap.innerText;
    const imgs = wrap.querySelectorAll('img');
    
    // 컴포넌트 순서 분석
    const order = [];
    const children = wrap.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const isDocTitle = child.classList.contains('se-documentTitle');
      const hasImg = child.querySelector('img') !== null;
      const firstText = (child.innerText || '').trim().substring(0, 40).replace(/\n/g, ' ');
      
      if (isDocTitle) {
        order.push({ type: 'TITLE', text: firstText.substring(0, 30) });
      } else if (hasImg) {
        const imgSrc = child.querySelector('img')?.getAttribute('src') || '';
        const fileName = imgSrc.includes('freelancer_thumb') ? 'thumb' : 
                         imgSrc.includes('freelancer_01') ? '01_문제' :
                         imgSrc.includes('freelancer_02') ? '02_솔루션' :
                         imgSrc.includes('freelancer_03') ? '03_결과' :
                         imgSrc.includes('freelancer_cta') ? '04_CTA' : '기타';
        order.push({ type: 'IMAGE', file: fileName });
      } else if (firstText) {
        order.push({ type: 'TEXT', text: firstText.substring(0, 30) });
      }
    }
    
    return {
      imgCount: imgs.length,
      textLength: text.length,
      componentCount: order.length,
      order: order.slice(0, 20)
    };
  });
  
  console.log('=== 에디터 구조 ===');
  console.log(JSON.stringify(structure, null, 2));
  
  await page.screenshot({ path: 'editor_structure.png' });
  await b.close();
})();
