const { chromium } = require('playwright');

(async () => {
  try {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
    const contexts = browser.contexts();
    const pages = contexts[0]?.pages() || [];
    
    console.log('=== 연결됨 ===');
    for (const p of pages) {
      console.log('탭:', p.url());
    }
    
    // 블로그 수정 페이지 찾기
    const editPage = pages.find(p => p.url().includes('PostWrite') || p.url().includes('blog.naver.com'));
    if (!editPage) {
      console.log('블로그 페이지를 찾을 수 없습니다.');
      await browser.disconnect();
      return;
    }
    
    console.log('\n=== 페이지 분석 ===', editPage.url());
    await editPage.waitForLoadState('networkidle');
    
    // iframe 분석
    const frames = editPage.frames();
    console.log(`프레임 수: ${frames.length}`);
    for (const f of frames) {
      const url = f.url();
      if (url.includes('smarteditor') || url.includes('Editor')) {
        console.log('에디터 프레임:', url.substring(0, 100));
        try {
          const body = await f.content();
          console.log('에디터 body 길이:', body.length);
          // 에디터 영역 찾기
          const seContainer = await f.$('.se-main-container');
          if (seContainer) {
            const html = await seContainer.innerHTML();
            console.log('현재 본문 길이:', html.length);
            console.log('내용 샘플:', html.substring(0, 200));
          }
          const docTitle = await f.evaluate(() => {
            try { return SmartEditor?._editors?.blogpc001?.getDocumentTitle(); } catch(e) { return 'N/A'; }
          });
          console.log('제목:', docTitle);
        } catch(e) {
          console.log('에디터 프레임 접근 오류:', e.message);
        }
      } else if (!url.startsWith('about:blank')) {
        console.log('기타 프레임:', url.substring(0, 100));
      }
    }
    
    await browser.disconnect();
  } catch(e) {
    console.error('오류:', e.message);
  }
})();
