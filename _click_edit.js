const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  try {
    // 포스팅 페이지 열기
    await page.goto('https://blog.naver.com/aicut/224341544476', { waitUntil: 'load', timeout: 20000 });
    await sleep(4000);

    // PostView iframe 찾기
    const pf = page.frames().find(f => f.url().includes('PostView'));
    if (!pf) { console.log('PostView iframe not found'); return; }

    // iframe에서 수정 버튼 강제 클릭
    await pf.evaluate(() => {
      const link = document.querySelector('a._modifyPost');
      if (link) {
        console.log('Found _modifyPost, href:', link.href);
        // 직접 location 변경
        window.location.href = 'https://blog.naver.com/PostEdit.naver?blogId=aicut&postNo=224341544476&from=postView';
      } else {
        console.log('_modifyPost not found');
      }
    });

    await sleep(5000);
    console.log('After redirect URL:', page.url());
    await page.screenshot({ path: '_debug_after_edit_click.png' });

    // 페이지가 navigation을 해서 새로운 컨텍스트가 되었을 수 있음
    const newUrl = page.url();
    if (newUrl.includes('PostEdit')) {
      console.log('✅ 수정 페이지 접속 성공');
      
      // 에디터가 로딩될 때까지 대기
      for (let i = 0; i < 15; i++) {
        await sleep(2000);
        
        // 제목 입력 필드 확인
        const hasTitle = await page.$('#title, .se-title, input[placeholder*="제목"], textarea[placeholder*="제목"]').catch(() => null);
        if (hasTitle) {
          console.log('✅ 에디터 로딩 완료 (try', i+1, ')');
          break;
        }
        
        // SE4 확인
        const seReady = await page.evaluate(() => {
          const se = window.SmartEditor?.instance || window.SmartEditor?._editors?.blogpc001;
          return !!se;
        }).catch(() => false);
        
        if (seReady) {
          console.log('✅ SE4 준비됨 (try', i+1, ')');
          break;
        }
        console.log(`  대기 중... (${i+1}/15)`);
      }
      
      await page.screenshot({ path: '_debug_editor_ready.png' });
      
      // 최종 상태 확인
      const status = await page.evaluate(() => {
        const se = window.SmartEditor?.instance || window.SmartEditor?._editors?.blogpc001;
        if (!se) return { seFound: false };
        
        try {
          const data = se._documentService.getDocumentData();
          return {
            seFound: true,
            compCount: data.length,
            comps: data.slice(0, 8).map(c => ({ 
              type: c.type, 
              text: (c.text || '').substring(0, 50),
              align: c.align
            }))
          };
        } catch(e) {
          return { seFound: true, error: e.message };
        }
      });
      
      console.log('에디터 상태:', JSON.stringify(status, null, 2));
    } else {
      console.log('❌ 수정 페이지 이동 실패. 현재 URL:', newUrl);
    }
    
  } finally {
    await page.close();
  }
})();
