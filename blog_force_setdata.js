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
    
    // setDocumentData의 error 우회: _documentDataStore.setDocumentData 직접 호출
    const bodyContent = fs.readFileSync('C:\\Users\\paul\\.openclaw\\workspace\\blog_aicut_20260625_mobile.html', 'utf-8');
    const bodyMatch = bodyContent.match(/<body>([\s\S]*?)<\/body>/);
    const innerHtml = bodyMatch ? bodyMatch[1].trim() : bodyContent;
    
    const result = await pf.evaluate((html) => {
      try {
        const se = SmartEditor._editors['blogpc001'];
        const ds = se._documentService;
        
        // _documentDataStore.setDocumentData 직접 호출 (JSON 기대)
        // 대신 _documentService.setDocumentData에 HTML 전달 시 try-catch
        try {
          ds.setDocumentData(html);
        } catch(e) {
          console.log('1차 시도 실패:', e.message);
          
          // 방법: component 변환기 사용
          const converter = ds._documentConverter;
          if (converter && typeof converter.convertDocument === 'function') {
            console.log('converter.convertDocument exists');
            try {
              const jsonData = converter.convertDocument(html);
              console.log('변환 성공:', typeof jsonData);
              ds._documentDataStore.setDocumentData(jsonData);
            } catch(e2) {
              console.log('converter 실패:', e2.message);
            }
          }
        }
        
        // 상태 확인
        const data = ds._documentDataStore.getDocumentData();
        return {
          dataType: typeof data,
          hasComponents: data?.document?.components ? data.document.components.length : 0,
          keys: data ? Object.keys(data) : []
        };
      } catch(e) {
        return { error: e.message, stack: e.stack?.substring(0, 300) };
      }
    }, innerHtml).catch(e => ({ error: e.message }));
    
    console.log('결과:', JSON.stringify(result, null, 2));
    
    await context.close();
  } catch(e) {
    console.error('오류:', e.message);
    console.error(e.stack);
  }
})();
