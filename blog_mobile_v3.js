const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  try {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
    const context = browser.contexts()[0];
    
    // 새 탭 열기 - Redirect=Update URL 사용
    const page = await context.newPage();
    page.on('dialog', async (d) => { console.log('dialog:', d.message().substring(0,100)); await d.dismiss(); });
    
    await page.goto('https://blog.naver.com/aicut?Redirect=Update&logNo=224326578253', {
      timeout: 30000,
      waitUntil: 'domcontentloaded'
    }).catch(() => {});
    console.log('페이지 로드됨:', page.url().substring(0, 100));
    await page.waitForTimeout(5000);
    
    // 모든 프레임 찾기
    const allFrames = page.frames();
    console.log(`프레임 수: ${allFrames.length}`);
    
    // PostUpdateForm 찾기
    let pf = allFrames.find(f => f.url().includes('PostUpdateForm'));
    if (!pf) {
      console.log('PostUpdateForm 없음');
      allFrames.forEach(f => console.log(' -', f.url().substring(0, 120)));
      
      // 네이버 로그인 페이지인지 확인
      const body = await page.content();
      if (body.includes('login') || body.includes('Login') || body.includes('로그인')) {
        console.log('로그인 페이지입니다.');
      }
      await context.close();
      return;
    }
    console.log('PostUpdateForm 발견!');
    
    // SmartEditor 확인
    const seInfo = await pf.evaluate(() => {
      try {
        const se = SmartEditor._editors['blogpc001'];
        const ds = se._documentService;
        const dds = ds._documentDataStore;
        const data = dds.getDocumentData();
        
        return {
          title: se.getDocumentTitle(),
          textLen: se.getContentText().length,
          hasDocData: !!data,
          dataKeys: data ? Object.keys(data).join(',') : 'none',
          compCount: data?.document?.components?.length || 0
        };
      } catch(e) {
        return { error: e.message };
      }
    }).catch(e => ({ error: e.message }));
    console.log('SE 정보:', JSON.stringify(seInfo, null, 2));
    
    if (seInfo.error) {
      console.log('SmartEditor 접근 실패');
      await context.close();
      return;
    }
    
    // 현재 문서 데이터 백업
    const docData = await pf.evaluate(() => {
      const se = SmartEditor._editors['blogpc001'];
      return se._documentService._documentDataStore.getDocumentData();
    }).catch(() => null);
    
    // 새 접근법: 문서 포맷 분석
    console.log('\n=== 문서 포맷 분석 ===');
    const formatInfo = await pf.evaluate(() => {
      const se = SmartEditor._editors['blogpc001'];
      const dds = se._documentService._documentDataStore;
      const data = dds.getDocumentData();
      
      // 컴포넌트 데이터 구조 분석
      const doc = data?.document;
      if (!doc) return { noDoc: true };
      
      const result = {
        version: doc.version,
        theme: doc.theme,
        hasComponents: Array.isArray(doc.components),
        compCount: doc.components?.length || 0,
        firstComp: doc.components?.[0] ? {
          type: doc.components[0].type,
          keys: Object.keys(doc.components[0])
        } : null
      };
      
      // 컴포넌트 상세
      if (doc.components && doc.components.length > 0) {
        result.components = doc.components.slice(0, 3).map(c => ({
          type: c.type,
          keys: Object.keys(c),
          value: JSON.stringify(c).substring(0, 200)
        }));
      }
      
      return result;
    }).catch(e => ({ error: e.message }));
    console.log('포맷 정보:', JSON.stringify(formatInfo, null, 2));
    
    // 본문 HTML을 SE4 컴포넌트 포맷으로 직접 변환하여 데이터 주입
    console.log('\n=== 모바일 최적화 적용 ===');
    
    const html = fs.readFileSync('C:\\Users\\paul\\.openclaw\\workspace\\blog_aicut_20260625_mobile.html', 'utf-8');
    const bodyMatch = html.match(/<body>([\s\S]*?)<\/body>/);
    const contentHtml = bodyMatch ? bodyMatch[1].trim() : html;
    
    const result = await pf.evaluate((bodyHtml) => {
      try {
        const se = SmartEditor._editors['blogpc001'];
        const ds = se._documentService;
        const converter = ds._documentConverter;
        
        // converter의 convertDocument 호출 시도 (에러 상세)
        try {
          // 일반 HTML을 SE4 문서 포맷으로 변환
          // SE4는 HTML을 내부 컴포넌트 구조로 변환
          const result = converter.convertDocument(bodyHtml);
          console.log('변환 성공');
          
          // 변환된 데이터를 store에 설정
          ds._documentDataStore.setDocumentData(result);
          
          return { ok: true, resultType: typeof result };
        } catch(convertErr) {
          return { 
            ok: false, 
            convertError: convertErr.message,
            converterExists: !!converter,
            converterKeys: converter ? Object.getOwnPropertyNames(Object.getPrototypeOf(converter)).join(', ') : 'none',
            htmlLen: bodyHtml.length
          };
        }
      } catch(e) {
        return { ok: false, error: e.message };
      }
    }, contentHtml).catch(e => ({ error: e.message }));
    console.log('변환 결과:', JSON.stringify(result, null, 2));
    
    // 결과 확인
    const after = await pf.evaluate(() => {
      const se = SmartEditor._editors['blogpc001'];
      return {
        textLen: se.getContentText().length,
        compCount: se._documentService._documentDataStore.getDocumentData()?.document?.components?.length || 0
      };
    }).catch(e => ({ error: e.message }));
    console.log('After:', JSON.stringify(after));
    
    await context.close();
  } catch(e) {
    console.error('FATAL:', e.message);
  }
})();
