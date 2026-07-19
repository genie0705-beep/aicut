const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();

  // 현재 에디터 페이지 중에서 확인
  for (const p of pages) {
    const url = p.url();
    if (url.includes('PostWriteForm') || url.includes('Redirect=Write')) {
      console.log(`에디터 페이지: ${url.substring(0, 100)}`);
      
      // Iframe 내용 확인
      const frames = p.frames();
      for (const f of frames) {
        try {
          const hasSE = await f.evaluate(() => typeof SmartEditor !== 'undefined');
          if (hasSE) {
            const info = await f.evaluate(() => {
              const ed = SmartEditor._editors['blogpc001'];
              if (!ed) return { error: 'no editor' };
              return {
                title: ed.getTitle(),
                textLength: ed.getContentText().length,
                canvasContent: document.querySelector('.se-canvas')?.innerText?.substring(0, 200) || 'no canvas'
              };
            });
            console.log(`에디터 상태: ${JSON.stringify(info)}`);
            
            // 제목 다시 설정
            await f.evaluate(() => {
              SmartEditor._editors['blogpc001'].setDocumentTitle('제헌절 7월, 서울 가족·연인 데이트 코스 BEST 5');
            });
            console.log('제목 재설정 완료');
          }
        } catch(e) {}
      }
    }
  }
  
  console.log('\n✅ 확인 완료 — 브라우저를 직접 확인해주세요');
})();
