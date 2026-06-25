const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  try {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
    const context = browser.contexts()[0];
    
    // 기존 Redirect=Update 탭 닫고 새로 열기
    const pages = context.pages();
    const oldTab = pages.find(p => p.url().includes('Redirect=Update'));
    if (oldTab) {
      await oldTab.close().catch(() => {});
      console.log('기존 탭 닫음');
    }
    
    // 새 탭에서 수정 페이지 열기
    const newPage = await context.newPage();
    newPage.on('dialog', async (dialog) => {
      console.log('다이얼로그:', dialog.message().substring(0, 100));
      await dialog.dismiss();
    });
    
    // PostUpdate.nhn URL 사용 (blog_edit_upload.js 참조)
    const LOGNO = '224326578253';
    await newPage.goto('https://blog.naver.com/PostUpdate.nhn?blogId=aicut&logNo=' + LOGNO, { 
      timeout: 30000, 
      waitUntil: 'domcontentloaded' 
    }).catch(() => {});
    console.log('수정 페이지 로드 완료');
    await newPage.waitForTimeout(5000);
    
    // PostUpdateForm iframe 찾기
    const pf = newPage.frames().find(f => f.url().includes('PostUpdateForm'));
    if (!pf) {
      console.log('PostUpdateForm 없음. 프레임 목록:');
      newPage.frames().forEach(f => console.log(' -', f.url().substring(0, 100)));
      await context.close();
      return;
    }
    console.log('PostUpdateForm 발견');
    
    // 현재 내용 확인
    const before = await pf.evaluate(() => {
      try {
        const se = SmartEditor._editors['blogpc001'];
        return {
          title: se.getDocumentTitle(),
          textLen: se.getContentText().length,
          textSnippet: se.getContentText().substring(0, 100)
        };
      } catch(e) {
        return { error: e.message };
      }
    }).catch(e => ({ error: e.message }));
    console.log('Before:', JSON.stringify(before));
    
    // 모바일 최적화 HTML
    const html = fs.readFileSync('C:\\Users\\paul\\.openclaw\\workspace\\blog_aicut_20260625_mobile.html', 'utf-8');
    const bodyMatch = html.match(/<body>([\s\S]*?)<\/body>/);
    const contentHtml = bodyMatch ? bodyMatch[1].trim() : html;
    
    // 콘솔 로그 캡처
    const logs = [];
    newPage.on('console', msg => logs.push(msg.text().substring(0, 150)));
    
    // 방법 1: _documentService.setDocumentData에 적절한 HTML 전달
    // SE4는 내부 컴포넌트로 변환. 본문 HTML만 전달 (body 태그 없이)
    console.log('\n=== setDocumentData 시도 ===');
    const setResult = await pf.evaluate((bodyHtml) => {
      try {
        const se = SmartEditor._editors['blogpc001'];
        const ds = se._documentService;
        
        // 실제 setDocumentData 호출
        ds.setDocumentData(bodyHtml);
        
        // 성공 확인
        const data = ds._documentDataStore.getDocumentData();
        const text = ds.getContentText();
        return {
          ok: true,
          dataHasComponents: data?.document?.components ? data.document.components.length : 0,
          textLen: text.length,
          textSample: text.substring(0, 100)
        };
      } catch(e) {
        return { ok: false, error: e.message, stack: e.stack?.substring(0, 300) };
      }
    }, contentHtml).catch(e => ({ error: e.message }));
    console.log('setDocumentData 결과:', JSON.stringify(setResult, null, 2));
    
    await newPage.waitForTimeout(3000);
    
    // 방법 2: 실패 시 _documentDataStore 직접 설정
    if (!setResult.ok) {
      console.log('\n=== _documentDataStore 직접 설정 시도 ===');
      const dsResult = await pf.evaluate((bodyHtml) => {
        try {
          const se = SmartEditor._editors['blogpc001'];
          const ds = se._documentService;
          const dds = ds._documentDataStore;
          
          // 현재 데이터 구조 확인
          const currentData = dds.getDocumentData();
          console.log('현재 데이터:', JSON.stringify(currentData).substring(0, 200));
          
          // _documentConverter로 변환 시도
          const converter = ds._documentConverter;
          console.log('converter 존재:', !!converter);
          console.log('converter methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(converter)).filter(k => typeof converter[k] === 'function').join(', '));
          
          if (converter && converter.convertDocument) {
            const converted = converter.convertDocument(bodyHtml);
            console.log('변환 결과 타입:', typeof converted);
            dds.setDocumentData(converted);
            return { ok: true, converted: true };
          }
          return { ok: false, msg: 'converter 없음' };
        } catch(e) {
          return { ok: false, error: e.message, stack: e.stack?.substring(0, 300) };
        }
      }, contentHtml).catch(e => ({ error: e.message }));
      console.log('_documentDataStore 결과:', JSON.stringify(dsResult, null, 2));
      
      await newPage.waitForTimeout(2000);
      
      // 결과 확인
      const after = await pf.evaluate(() => {
        try {
          const se = SmartEditor._editors['blogpc001'];
          const ds = se._documentService;
          const data = ds._documentDataStore.getDocumentData();
          return {
            textLen: ds.getContentText().length,
            compCount: data?.document?.components?.length || 0
          };
        } catch(e) {
          return { error: e.message };
        }
      }).catch(e => ({ error: e.message }));
      console.log('After:', JSON.stringify(after));
    }
    
    console.log('\n=== 완료 ===');
    // 저장 버튼 찾기 (PostUpdateForm 내)
    const saveResult = await pf.evaluate(() => {
      // 저장 버튼 찾기
      const btn = document.querySelector('em:has(span), button:has(span)');
      const allBtns = document.querySelectorAll('em, button, a');
      let saveBtn = null;
      allBtns.forEach(b => {
        const t = (b.textContent || '').trim();
        if (t === '저장') saveBtn = t;
      });
      return { saveBtn };
    }).catch(e => ({ error: e.message }));
    console.log('저장 버튼:', JSON.stringify(saveResult));
    
    await context.close();
  } catch(e) {
    console.error('FATAL:', e.message);
  }
})();
