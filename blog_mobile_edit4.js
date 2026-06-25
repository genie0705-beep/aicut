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
    await editPage.waitForTimeout(3000);
    
    const pf = editPage.frames().find(f => f.url().includes('PostUpdateForm'));
    if (!pf) { console.log('PostUpdateForm 없음'); await context.close(); return; }
    
    // SmartEditor 모든 속성 탐색
    const apiInfo = await pf.evaluate(() => {
      const se = SmartEditor._editors['blogpc001'];
      const keys = Object.getOwnPropertyNames(Object.getPrototypeOf(se));
      const ownKeys = Object.keys(se);
      const docServiceKeys = se._documentService ? Object.getOwnPropertyNames(Object.getPrototypeOf(se._documentService)) : ['_documentService is null'];
      const docServiceOwn = se._documentService ? Object.keys(se._documentService) : [];
      
      return {
        protoMethods: keys.filter(k => typeof se[k] === 'function').slice(0, 30),
        ownProps: ownKeys.slice(0, 20),
        docServiceMethods: docServiceKeys.slice(0, 20),
        docServiceOwn: docServiceOwn.slice(0, 20),
        hasDocService: !!se._documentService,
        docServiceType: se._documentService ? typeof se._documentService : 'null'
      };
    }).catch(e => ({ error: e.message }));
    
    console.log('API 정보:', JSON.stringify(apiInfo, null, 2));
    
    // _documentService의 setDocumentData 직접 호출
    if (apiInfo.hasDocService) {
      const bodyContent = fs.readFileSync('C:\\Users\\paul\\.openclaw\\workspace\\blog_aicut_20260625_mobile.html', 'utf-8');
      const bodyMatch = bodyContent.match(/<body>([\s\S]*?)<\/body>/);
      const innerHtml = bodyMatch ? bodyMatch[1].trim() : bodyContent;
      
      const result = await pf.evaluate((html) => {
        try {
          const se = SmartEditor._editors['blogpc001'];
          
          // _documentService 직접 호출
          if (se._documentService && typeof se._documentService.setDocumentData === 'function') {
            se._documentService.setDocumentData(html);
            return 'setDocumentData 직접 호출 성공';
          }
          
          // setDocumentData로 다시 시도 (문자열이 아닌 경우 처리)
          se.setDocumentData(html);
          return 'setDocumentData 호출 성공';
        } catch(e) {
          return '오류: ' + e.message + ' | 스택: ' + e.stack?.substring(0, 200);
        }
      }, innerHtml).catch(e => 'Error: ' + e.message);
      console.log('API 호출 결과:', result);
      
      await pf.waitForTimeout(2000);
      
      // 변경 확인
      const check = await pf.evaluate(() => {
        const se = SmartEditor._editors['blogpc001'];
        return {
          title: se.getDocumentTitle(),
          dataLen: typeof se.getDocumentData === 'function' ? se.getDocumentData().length : 'N/A',
          dataSnippet: typeof se.getDocumentData === 'function' ? se.getDocumentData().substring(0, 200) : 'N/A'
        };
      }).catch(e => ({ error: e.message }));
      console.log('변경 확인:', JSON.stringify(check, null, 2));
    }
    
    await context.close();
  } catch(e) {
    console.error('오류:', e.message);
    console.error(e.stack);
  }
})();
