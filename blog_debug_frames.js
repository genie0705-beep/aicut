const { chromium } = require('playwright');

(async () => {
  try {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
    const context = browser.contexts()[0];
    const pages = context.pages();
    
    // Redirect=Update 탭
    const editPage = pages.find(p => p.url().includes('Redirect=Update'));
    if (!editPage) {
      console.log('수정 페이지 없음');
      await context.close();
      return;
    }
    
    await editPage.bringToFront();
    await editPage.waitForTimeout(3000);
    
    // 모든 프레임 재귀 탐색
    function exploreFrames(frame, depth = 0) {
      const indent = '  '.repeat(depth);
      const url = frame.url();
      if (url.startsWith('about:blank') && depth > 0) return;
      console.log(`${indent}프레임:`, url.substring(0, 120));
      
      // 에디터 관련 키워드
      if (url.includes('smart') || url.includes('SE') || url.includes('editor') || url.includes('Editor')) {
        console.log(`${indent}>>> 에디터 발견!`);
      }
      
      const children = frame.childFrames();
      for (const child of children) {
        exploreFrames(child, depth + 1);
      }
    }
    
    const mainFrames = editPage.frames();
    console.log('=== 모든 프레임 트리 ===');
    for (const f of mainFrames) {
      if (f.url().startsWith('about:blank') && mainFrames.length > 1) continue;
      exploreFrames(f);
    }
    
    console.log('\n=== PostUpdateForm 내부 탐색 ===');
    for (const f of editPage.frames()) {
      if (f.url().includes('PostUpdateForm')) {
        console.log('\nPostUpdateForm URL:', f.url());
        
        // 프레임 내부 HTML 확인
        const html = await f.content().catch(() => 'N/A');
        console.log('HTML 길이:', html.length);
        
        // SmartEditor 객체 확인
        const hasSE = await f.evaluate(() => {
          return {
            hasSmartEditor: typeof SmartEditor !== 'undefined',
            editors: typeof SmartEditor?._editors,
            editorKeys: SmartEditor?._editors ? Object.keys(SmartEditor._editors) : []
          };
        }).catch(() => ({}));
        console.log('SmartEditor:', JSON.stringify(hasSE));
        
        // se-main-container 찾기
        const seContainer = await f.$('.se-main-container').catch(() => null);
        if (seContainer) {
          const text = await seContainer.textContent();
          console.log('se-main-container 내용:', (text || '').substring(0, 200));
          
          // iframe 내 smart editor 찾기
          const smartEditorIframe = await f.$('iframe[class*="smart"]').catch(() => null);
          if (smartEditorIframe) {
            console.log('smart editor iframe 발견!');
          }
        }
        
        // iframe 요소들 확인
        const iframes = await f.$$('iframe');
        console.log(`PostUpdateForm 내 iframes: ${iframes.length}`);
        for (const iframe of iframes) {
          const src = await iframe.getAttribute('src').catch(() => 'N/A');
          const cls = await iframe.getAttribute('class').catch(() => 'N/A');
          const id = await iframe.getAttribute('id').catch(() => 'N/A');
          console.log(`  iframe: id=${id}, class=${cls}, src=${(src || '').substring(0, 100)}`);
        }
      }
    }
    
    await context.close();
  } catch(e) {
    console.error('오류:', e.message);
    console.error(e.stack);
  }
})();
