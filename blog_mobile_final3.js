const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  try {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
    const ctx = browser.contexts()[0];
    const page = ctx.pages().find(p => p.url().includes('Redirect=Update'));
    if (!page) { await ctx.close(); return; }
    await page.bringToFront();
    await page.waitForTimeout(2000);
    
    const pf = page.frames().find(f => f.url().includes('PostUpdateForm'));
    if (!pf) { await ctx.close(); return; }
    
    // 1. createComponentByCtype 반환 구조 분석 + 데이터 직접 조작
    const info = await pf.evaluate(() => {
      const factory = SmartEditor._editors['blogpc001']._documentService._componentFactory;
      const textComp = factory.createComponentByCtype('text');
      return {
        textCompLen: textComp?.length || 0,
        firstCompStr: textComp?.[0] ? JSON.stringify(textComp[0]).substring(0, 500) : 'none',
        allKeys: textComp?.[0] ? Object.keys(textComp[0]) : []
      };
    });
    console.log('컴포넌트 구조:', JSON.stringify(info, null, 2));
    
    // 2. 컴포넌트 데이터로 components 구성 후 setDocumentData
    const mobileHtml = fs.readFileSync('C:\\Users\\paul\\.openclaw\\workspace\\blog_aicut_20260625_mobile.html', 'utf-8');
    const bodyMatch = mobileHtml.match(/<body>([\s\S]*?)<\/body>/);
    const contentHtml = bodyMatch ? bodyMatch[1].trim() : mobileHtml;
    
    // 3. SE4 포맷으로 HTML 변환 후 setDocumentData 재시도
    const se4Html = await pf.evaluate(() => {
      const se = SmartEditor._editors['blogpc001'];
      const originalHtml = se._documentService._documentDataStore.document?.components?.[0]?.html;
      return { originalHtml: originalHtml?.substring(0, 500) };
    });
    
    console.log('기존 데이터 HTML 샘플:', JSON.stringify(se4Html));
    
    // 방법: 직접 dds.document에 데이터 주입
    const result = await pf.evaluate((bodyHtml) => {
      const se = SmartEditor._editors['blogpc001'];
      const dds = se._documentService._documentDataStore;
      const factory = se._documentService._componentFactory;
      
      try {
        // 현재 doc 구조 확인
        const doc = dds.document;
        const docId = dds.documentId;
        
        // 제목 설정
        se.setDocumentTitle('릴스 알고리즘 2026, 월드컵과 함께하는 AI 영상편집 시대의 숏폼 마케팅 전략');
        
        // DOM 파서로 HTML 파싱
        const parser = new DOMParser();
        const parsed = parser.parseFromString(bodyHtml, 'text/html');
        const children = Array.from(parsed.body.children);
        
        const components = [];
        
        // documentTitle 컴포넌트 추가 (factory로 생성)
        const titleCompData = factory.createComponentByCtype('documentTitle');
        if (titleCompData?.[0]) components.push(titleCompData[0]);
        
        // 각 요소를 텍스트 컴포넌트로 변환
        for (const el of children) {
          const tag = el.tagName.toLowerCase();
          if (tag === 'p' || tag === 'h2' || tag === 'h3') {
            const textComps = factory.createComponentByCtype('text');
            if (textComps?.[0]) {
              const comp = textComps[0];
              const innerText = el.innerHTML || el.textContent || '';
              
              // 컴포넌트 데이터에 텍스트 설정
              // 구조를 모르니 모든 가능한 경로에 설정
              if (comp.componentData?.texts?.[0]) {
                comp.componentData.texts[0].text = innerText;
                comp.componentData.texts[0].align = 'center';
              }
              if (comp.text) comp.text = innerText;
              if (comp.html) comp.html = innerText;
              
              components.push(comp);
            }
          }
        }
        
        // 데이터 설정
        dds.document.components = components;
        dds.setValidSet(true);
        
        return {
          ok: true,
          compCount: components.length,
          textLen: se.getContentText().length,
          docCompLen: dds.document.components?.length || 0
        };
      } catch(e) {
        return {
          ok: false,
          error: e.message,
          stack: e.stack?.substring(0, 300)
        };
      }
    }, contentHtml).catch(e => ({ error: e.message }));
    
    console.log('결과:', JSON.stringify(result, null, 2));
    
    await page.waitForTimeout(3000);
    
    if (result.ok) {
      const after = await pf.evaluate(() => {
        const wrap = document.querySelector('.se-components-wrap');
        const comps = wrap?.querySelectorAll('.se-component');
        const textLen = SmartEditor._editors['blogpc001'].getContentText().length;
        return {
          domCompCount: comps?.length || 0,
          textLen
        };
      }).catch(e => ({ error: e.message }));
      console.log('After:', JSON.stringify(after));
    }
    
    await ctx.close();
  } catch(e) {
    console.error('FATAL:', e.message);
  }
})();
