const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  try {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
    const context = browser.contexts()[0];
    const pages = context.pages();
    
    const editPage = pages.find(p => p.url().includes('Redirect=Update'));
    if (!editPage) { console.log('수정 페이지 없음'); await context.close(); return; }
    await editPage.bringToFront();
    await editPage.waitForTimeout(2000);
    
    const pf = editPage.frames().find(f => f.url().includes('PostUpdateForm'));
    if (!pf) { console.log('PostUpdateForm 없음'); await context.close(); return; }
    
    // se-content 영역 내부 HTML 확인
    const contentHtml = await pf.evaluate(() => {
      const content = document.querySelector('.se-content');
      const seWrap = document.querySelector('.se-wrap');
      const container = document.querySelector('.se-container');
      
      // SE4 컴포넌트 구조 확인
      const components = document.querySelectorAll('.se-component');
      
      return {
        contentInner: content?.innerHTML?.substring(0, 300) || 'no content',
        seWrapInner: seWrap?.innerHTML?.substring(0, 200) || 'no wrap',
        containerInner: container?.innerHTML?.substring(0, 200) || 'no container',
        compCount: components.length,
        componentTags: Array.from(components).slice(0, 5).map(c => ({
          cls: c.className.substring(0, 60),
          inner: c.innerHTML.substring(0, 100)
        }))
      };
    }).catch(e => ({ error: e.message }));
    console.log('Content HTML:', JSON.stringify(contentHtml, null, 2));
    
    // _documentDataStore 접근
    const storeInfo = await pf.evaluate(() => {
      const se = SmartEditor._editors['blogpc001'];
      const ds = se._documentService;
      
      // _documentDataStore 분석
      const dds = ds._documentDataStore;
      const data = dds ? dds.getDocumentData?.() : null;
      
      return {
        hasDocDataStore: !!dds,
        storeType: dds ? typeof dds : 'null',
        storeMethods: dds ? Object.getOwnPropertyNames(Object.getPrototypeOf(dds)).filter(k => typeof dds[k] === 'function').slice(0, 15) : [],
        // 직접 데이터 조회
        data: data ? (typeof data === 'string' ? data.substring(0, 200) : JSON.stringify(data).substring(0, 300)) : null
      };
    }).catch(e => ({ error: e.message }));
    console.log('Store info:', JSON.stringify(storeInfo, null, 2));
    
    await context.close();
  } catch(e) {
    console.error('오류:', e.message);
    console.error(e.stack);
  }
})();
