const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  try {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
    const context = browser.contexts()[0];
    
    // 새로고침 - 이전 페이지 유지 (새 탭 안 열고)
    const pages = context.pages();
    const page = pages.find(p => p.url().includes('Redirect=Update'));
    if (!page) { console.log('페이지 없음'); await context.close(); return; }
    await page.bringToFront();
    await page.waitForTimeout(2000);
    
    const pf = page.frames().find(f => f.url().includes('PostUpdateForm'));
    if (!pf) { console.log('PostUpdateForm 없음'); await context.close(); return; }
    
    // 기존 SE4 컴포넌트 HTML 구조 확인
    const seHtml = await pf.evaluate(() => {
      const seContent = document.querySelector('.se-content');
      const seCanvas = document.querySelector('.se-canvas');
      
      // 실제 컴포넌트 HTML 수집
      const components = seCanvas?.querySelectorAll('.se-component');
      const compList = [];
      if (components) {
        components.forEach((comp, i) => {
          if (i < 10) {
            compList.push({
              idx: i,
              cls: comp.className,
              innerHtml: comp.innerHTML.substring(0, 300)
            });
          }
        });
      }
      
      // canvas 내부 전체 HTML 구조 (처음 5000자)
      const canvasHtml = seCanvas?.innerHTML?.substring(0, 5000) || 'no canvas';
      
      return {
        compCount: components?.length || 0,
        compList: compList,
        canvasSample: canvasHtml.substring(0, 3000)
      };
    }).catch(e => ({ error: e.message }));
    
    console.log('=== SE4 컴포넌트 구조 ===');
    console.log('컴포넌트 수:', seHtml.compCount);
    console.log('컴포넌트 샘플:', JSON.stringify(seHtml.compList, null, 2));
    console.log('\n캔버스 HTML (처음 2000자):');
    console.log(seHtml.canvasSample?.substring(0, 2000));
    
    await context.close();
  } catch(e) {
    console.error('FATAL:', e.message);
  }
})();
