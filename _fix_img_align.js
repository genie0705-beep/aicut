const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const pages = b.contexts()[0].pages();
  let page;
  for (const p of pages) { if (p.url().includes('PostWriteForm')) { page = p; break; } }
  if (!page) { console.log('no editor'); process.exit(1); }
  
  await page.bringToFront();
  await page.waitForTimeout(1500);
  
  // 이미지 정렬을 center로 변경
  const result = await page.evaluate(() => {
    const wrap = document.querySelector('.se-components-wrap');
    if (!wrap) return 'no wrap';
    
    const imgs = wrap.querySelectorAll('img');
    let count = 0;
    
    imgs.forEach(img => {
      // 부모 figure 요소 찾기
      let parent = img.parentElement;
      while (parent && !parent.classList.contains('se-component')) {
        parent = parent.parentElement;
      }
      
      if (parent) {
        // 이미지 컴포넌트의 align 속성 설정
        const component = parent;
        // figure 내부의 이미지 정렬
        img.style.display = 'block';
        img.style.margin = '0 auto';
        
        // 부모 요소에 text-align center
        const section = component.querySelector('.se-section');
        if (section) {
          section.style.textAlign = 'center';
          const sectionAlign = section.getAttribute('align') || section.getAttribute('data-align');
          // align 속성 설정
          section.setAttribute('align', 'center');
          section.style.margin = '10px auto';
        }
        
        // figure 자체 정렬
        const figure = component.querySelector('figure');
        if (figure) {
          figure.style.textAlign = 'center';
          figure.style.margin = '10px auto';
        }
        
        // 이미지 주변 컨테이너
        const cont = component.querySelector('.se-module, .se-section, [class*="image"]');
        if (cont) {
          cont.style.textAlign = 'center';
        }
        
        count++;
      }
    });
    
    return count + ' images aligned to center';
  });
  
  console.log('Result:', result);
  await page.waitForTimeout(1000);
  
  // 저장
  await page.evaluate(() => document.querySelector('.save_btn__bzc5B')?.click());
  await page.waitForTimeout(3000);
  console.log('✅ 저장');
  
  await page.screenshot({ path: 'img_centered.png' });
  await b.close();
})();
