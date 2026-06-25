const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  try {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
    const ctx = browser.contexts()[0];
    const page = ctx.pages().find(p => p.url().includes('Redirect=Update'));
    if (!page) { await ctx.close(); return; }
    await page.bringToFront();
    await page.waitForTimeout(2000);
    
    const pf = page.frames().find(f => f.url().includes('PostUpdateForm'));
    if (!pf) { await ctx.close(); return; }
    
    // STEP 1: createComponentByCtype 재시도 (빈 상태)
    const compData = await pf.evaluate(() => {
      const factory = SmartEditor._editors['blogpc001']._documentService._componentFactory;
      const text = factory.createComponentByCtype('text');
      const title = factory.createComponentByCtype('documentTitle');
      return {
        textComp: text?.length > 0 ? JSON.parse(JSON.stringify(text[0])).substring?.(0, 500) || JSON.stringify(text[0]).substring(0, 500) : 'empty',
        titleComp: title?.length > 0 ? JSON.stringify(title[0]).substring(0, 500) : 'empty',
        textLen: text?.length || 0,
        titleLen: title?.length || 0,
        factoryExists: !!factory,
        factoryMethods: factory ? Object.getOwnPropertyNames(Object.getPrototypeOf(factory)).join(',') : 'none'
      };
    }).catch(e => ({ error: e.message }));
    console.log('Factory test:', JSON.stringify(compData, null, 2));
    
    // STEP 2: createComponentByCtype가 실패하면 createComponentWithCompData로 시도
    if (compData.textLen === 0) {
      console.log('createComponentByCtype 실패, 다른 방식 시도');
      
      // DOM에서 기존 템플릿 구조 추출
      const structure = await pf.evaluate(() => {
        // se-components-wrap에서 첫 번째 텍스트 컴포넌트의 HTML 추출
        const wrap = document.querySelector('.se-components-wrap');
        const firstComp = wrap?.querySelector('.se-component.se-text');
        if (firstComp) {
          return {
            html: firstComp.outerHTML.substring(0, 1000),
            cls: firstComp.className
          };
        }
        return null;
      });
      console.log('DOM template:', structure?.html?.substring(0, 500));
    }
    
    await ctx.close();
  } catch(e) {
    console.error('FATAL:', e.message);
  }
})();
