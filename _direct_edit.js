const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  try {
    console.log('📄 직접 수정 페이지로 이동...');
    await page.goto('https://blog.naver.com/PostEdit.naver?blogId=aicut&postNo=224341544476', { 
      waitUntil: 'load', 
      timeout: 30000 
    });
    
    // 에디터 로딩 대기
    console.log('⏳ 에디터 로딩 대기...');
    
    for (let i = 0; i < 30; i++) {
      await sleep(2000);
      
      const seFound = await page.evaluate(() => {
        const se = window.SmartEditor?.instance || window.SmartEditor?._editors?.blogpc001;
        if (se) return { found: true, hasDocSvc: !!se._documentService };
        
        // 페이지 내용 확인
        const bodyText = document.body?.innerText?.substring(0, 200) || '';
        return { found: false, bodyText, url: window.location.href, title: document.title };
      });
      
      if (seFound.found) {
        console.log(`✅ SE4 발견! (try ${i+1})`);
        
        // 문서 데이터 확인
        try {
          const docInfo = await page.evaluate(() => {
            const se = window.SmartEditor?.instance || window.SmartEditor?._editors?.blogpc001;
            const data = se._documentService.getDocumentData();
            return {
              count: data.length,
              summary: data.map(c => ({ 
                type: c.type, 
                text: (c.text || '').substring(0, 40),
                align: c.align || 'none'
              }))
            };
          });
          console.log('📋 문서 구조:', JSON.stringify(docInfo, null, 2));
        } catch(e) {
          console.log('docInfo error:', e.message);
        }
        break;
      }
      
      if (i % 5 === 4) {
        const url = await page.url();
        console.log(`  [${i+1}] URL: ${url}, 상태: ${JSON.stringify(seFound).substring(0, 200)}`);
        await page.screenshot({ path: `_debug_edit_${i+1}.png` });
      }
    }
    
    // 최종 스크린샷
    await page.screenshot({ path: '_debug_edit_final.png' });
    
  } finally {
    await page.close();
  }
})();
