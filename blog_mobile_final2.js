const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  try {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
    const ctx = browser.contexts()[0];
    const page = ctx.pages().find(p => p.url().includes('Redirect=Update'));
    if (!page) { console.log('페이지 없음'); await ctx.close(); return; }
    await page.bringToFront();
    await page.waitForTimeout(2000);
    
    const pf = page.frames().find(f => f.url().includes('PostUpdateForm'));
    if (!pf) { console.log('PostUpdateForm 없음'); await ctx.close(); return; }
    
    // 모바일 최적화 HTML 로드
    const html = fs.readFileSync('C:\\Users\\paul\\.openclaw\\workspace\\blog_aicut_20260625_mobile.html', 'utf-8');
    const bodyMatch = html.match(/<body>([\s\S]*?)<\/body>/);
    const contentHtml = bodyMatch ? bodyMatch[1].trim() : html;
    
    // 방법: _documentDataStore.document.components 직접 조작
    const result = await pf.evaluate((bodyHtml) => {
      const se = SmartEditor._editors['blogpc001'];
      const ds = se._documentService;
      const dds = ds._documentDataStore;
      const factory = ds._componentFactory;
      
      try {
        // 1. 현재 데이터 구조 유지
        const docData = dds.getDocumentData();
        if (!docData) return { ok: false, msg: 'no docData' };
        
        // 제목 설정
        const title = '릴스 알고리즘 2026, 월드컵과 함께하는 AI 영상편집 시대의 숏폼 마케팅 전략';
        se.setDocumentTitle(title);
        
        // 2. HTML을 SE4 텍스트 컴포넌트로 변환하여 components 배열 생성
        // 각 p/h2/h3 태그를 개별 텍스트 컴포넌트로 변환
        const parser = new DOMParser();
        const doc = parser.parseFromString(bodyHtml, 'text/html');
        const elements = doc.body.children;
        
        const components = [];
        
        for (const el of elements) {
          const tag = el.tagName.toLowerCase();
          if (tag === 'h2' || tag === 'h3' || tag === 'p') {
            // 텍스트 컴포넌트 데이터 생성
            const compData = factory.createComponentByCtype('text');
            if (compData && compData.length > 0) {
              const comp = compData[0];
              // 텍스트 내용 설정 - p 태그의 textContent 사용
              const text = el.innerHTML || el.textContent || '';
              
              // se-text-paragraph 구조로 변환
              // comp의 내부 구조에 텍스트 설정
              if (comp.componentData?.texts) {
                comp.componentData.texts = [{
                  text: text,
                  align: 'center',
                  styles: {}
                }];
              } else if (comp.componentData) {
                // 텍스트 내용을 직접 설정
                comp.componentData.texts = [{
                  text: text,
                  align: 'center'
                }];
              }
              
              components.push(comp);
            }
          } else if (tag === 'img') {
            // 이미지 컴포넌트 (빈 상태로 유지)
            const imgComp = factory.createComponentByCtype('image');
            if (imgComp && imgComp.length > 0) {
              components.push(imgComp[0]);
            }
          }
        }
        
        // 3. components 배열 설정
        dds.document.components = components;
        
        // 4. 변경 알림 - setValidSet 호출
        if (typeof dds.setValidSet === 'function') {
          dds.setValidSet(true);
        }
        
        return { 
          ok: true, 
          compCount: components.length,
          textLen: se.getContentText().length
        };
      } catch(e) {
        return { ok: false, error: e.message, stack: e.stack?.substring(0, 200) };
      }
    }, contentHtml).catch(e => ({ error: e.message }));
    
    console.log('결과:', JSON.stringify(result, null, 2));
    
    if (result.ok) {
      await page.waitForTimeout(3000);
      
      // 변경 확인 (화면 렌더링)
      const after = await pf.evaluate(() => {
        const wrap = document.querySelector('.se-components-wrap');
        const components = wrap?.querySelectorAll('.se-component');
        const textLen = SmartEditor._editors['blogpc001'].getContentText().length;
        
        return {
          compCount: components?.length || 0,
          textLen: textLen,
          firstCompText: components?.[1]?.textContent?.substring(0, 100) || 'none'
        };
      }).catch(e => ({ error: e.message }));
      console.log('After:', JSON.stringify(after));
    }
    
    await ctx.close();
  } catch(e) {
    console.error('FATAL:', e.message);
  }
})();
