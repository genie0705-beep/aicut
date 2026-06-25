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
    
    // PostUpdateForm 프레임 찾기
    const postFormFrame = editPage.frames().find(f => f.url().includes('PostUpdateForm'));
    if (!postFormFrame) { console.log('PostUpdateForm 없음'); await context.close(); return; }
    
    console.log('PostUpdateForm 접근 성공');
    
    // SmartEditor API 정보 확인
    const editorInfo = await postFormFrame.evaluate(() => {
      const se = SmartEditor._editors['blogpc001'];
      return {
        title: se.getDocumentTitle(),
        hasSetData: typeof se.setDocumentData === 'function',
        setDataParams: se.setDocumentData ? String(se.setDocumentData) : 'N/A',
        // 에디터 내부 구조
        body: se._body ? 'exists' : 'no body',
        el: se._el ? se._el.tagName : 'no el',
        options: se._options ? Object.keys(se._options).join(', ') : 'no options',
        editorType: se._editorType || 'unknown',
        doc: typeof se._doc,
      };
    }).catch(e => ({ error: e.message }));
    console.log('Editor info:', JSON.stringify(editorInfo, null, 2));
    
    // 에디터 내부 DOM 구조 확인
    const domInfo = await postFormFrame.evaluate(() => {
      const editor = document.querySelector('#smart_editor2');
      const editor2 = document.querySelector('#smart_editor');
      const seContainer = document.querySelector('.se-main-container');
      const editable = document.querySelector('[contenteditable="true"]');
      const editorArea = document.querySelector('#editor_area');
      
      return {
        '#smart_editor2': editor ? 'found' : 'not found',
        '#smart_editor': editor2 ? 'found' : 'not found',
        '.se-main-container': seContainer ? 'found' : 'not found',
        '[contenteditable]': editable ? {
          tag: editable.tagName,
          innerLength: editable.innerHTML.length,
          textLength: editable.textContent.length
        } : 'not found',
        '#editor_area': editorArea ? 'found' : 'not found',
        'se-ff': document.querySelector('.se-ff') ? 'found' : 'not found',
        // 모든 iframe 태그
        iframes: Array.from(document.querySelectorAll('iframe')).map(f => ({
          id: f.id,
          src: (f.src || '').substring(0, 60),
          cls: f.className
        }))
      };
    }).catch(e => ({ error: e.message }));
    console.log('DOM info:', JSON.stringify(domInfo, null, 2));
    
    // SmartEditor API로 직접 본문 설정 시도
    console.log('\n=== SmartEditor API로 제목 및 본문 설정 ===');
    const bodyContent = fs.readFileSync('C:\\Users\\paul\\.openclaw\\workspace\\blog_aicut_20260625_mobile.html', 'utf-8');
    const bodyMatch = bodyContent.match(/<body>([\s\S]*?)<\/body>/);
    const innerHtml = bodyMatch ? bodyMatch[1].trim() : bodyContent;
    
    const setResult = await postFormFrame.evaluate((html) => {
      try {
        const editor = SmartEditor._editors['blogpc001'];
        
        // 제목 설정
        editor.setDocumentTitle('릴스 알고리즘 2026, 월드컵과 함께하는 AI 영상편집 시대의 숏폼 마케팅 전략');
        console.log('제목 설정 완료');
        
        // 본문 설정 시도 - setDocumentData
        if (typeof editor.setDocumentData === 'function') {
          editor.setDocumentData(html);
          // React DOM 업데이트 확인
          setTimeout(() => {
            // editor 내부 내용 확인
            console.log('setDocumentData 실행됨');
          }, 500);
          return 'setDocumentData executed';
        }
        return 'setDocumentData not available';
      } catch(e) {
        return 'Error: ' + e.message;
      }
    }, innerHtml).catch(e => 'Error: ' + e.message);
    console.log('API 결과:', setResult);
    
    await editPage.waitForTimeout(2000);
    
    // 변경 후 본문 확인
    const checkResult = await postFormFrame.evaluate(() => {
      const editor = SmartEditor._editors['blogpc001'];
      return {
        title: editor.getDocumentTitle(),
        bodyLen: editor.getDocumentData ? editor.getDocumentData().length : 'N/A',
        hasDocData: typeof editor.getDocumentData === 'function'
      };
    }).catch(e => ({ error: e.message }));
    console.log('변경 확인:', JSON.stringify(checkResult, null, 2));
    
    await context.close();
  } catch(e) {
    console.error('오류:', e.message);
    console.error(e.stack);
  }
})();
