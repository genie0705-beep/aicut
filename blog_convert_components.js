const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  try {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
    const ctx = browser.contexts()[0];
    const page = ctx.pages().find(p => p.url().includes('Redirect=Update'));
    if (!page) { await ctx.close(); return; }
    await page.bringToFront();
    await page.waitForTimeout(3000);
    
    const pf = page.frames().find(f => f.url().includes('PostUpdateForm'));
    if (!pf) { await ctx.close(); return; }
    
    // 모바일 최적화 HTML
    const mobileHtml = fs.readFileSync('C:\\Users\\paul\\.openclaw\\workspace\\blog_aicut_20260625_mobile.html', 'utf-8');
    const bodyMatch = mobileHtml.match(/<body>([\s\S]*?)<\/body>/);
    const contentHtml = bodyMatch ? bodyMatch[1].trim() : mobileHtml;
    
    // 방법: convertComponents + setComponentList 조합
    const result = await pf.evaluate((html) => {
      const se = SmartEditor._editors['blogpc001'];
      const ds = se._documentService;
      
      try {
        // 1. HTML을 SE4 컴포넌트로 변환 (convertComponents는 배열 반환)
        const compDataList = ds.convertComponents(html);
        
        if (!compDataList || compDataList.length === 0) {
          return { ok: false, msg: '변환 결과 없음', compDataList };
        }
        
        // 2. 변환된 컴포넌트 리스트 설정
        ds.setComponentList(compDataList);
        
        // 3. 제목 설정
        se.setDocumentTitle('릴스 알고리즘 2026, 월드컵과 함께하는 AI 영상편집 시대의 숏폼 마케팅 전략');
        
        return {
          ok: true,
          compCount: compDataList.length,
          textLen: se.getContentText().length,
          firstComp: JSON.stringify(compDataList[0]).substring(0, 100)
        };
      } catch(e) {
        return { ok: false, error: e.message, stack: e.stack?.substring(0, 300) };
      }
    }, contentHtml).catch(e => ({ error: e.message }));
    
    console.log('변환+설정 결과:', JSON.stringify(result, null, 2));
    
    // 실패 시 write 방식으로 fallback
    if (!result.ok) {
      console.log('\n=== write 방식 fallback ===');
      
      // 텍스트만 추출 (태그 제거)
      const plainText = contentHtml
        .replace(/<h2[^>]*>/g, '\n')
        .replace(/<\/h2>/g, '\n')
        .replace(/<h3[^>]*>/g, '\n')
        .replace(/<\/h3>/g, '\n')
        .replace(/<p[^>]*>/g, '')
        .replace(/<\/p>/g, '\n')
        .replace(/<br\s*\/?>/g, '\n')
        .replace(/<strong>([\s\S]*?)<\/strong>/g, '$1')
        .replace(/<[^>]+>/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      
      await pf.evaluate(() => {
        const se = SmartEditor._editors['blogpc001'];
        se._documentService.resetDocumentData();
        se.setDocumentTitle('릴스 알고리즘 2026, 월드컵과 함께하는 AI 영상편집 시대의 숏폼 마케팅 전략');
      });
      await page.waitForTimeout(2000);
      
      // focus 주고 write
      await pf.evaluate((text) => {
        const se = SmartEditor._editors['blogpc001'];
        se._canvasScrollingService.focusToFirstComp();
        const es = se._editingService;
        
        // 텍스트를 문단별로 분할
        const paragraphs = text.split('\n').filter(p => p.trim());
        for (let i = 0; i < paragraphs.length; i++) {
          es.write(paragraphs[i].trim());
          if (i < paragraphs.length - 1) {
            es.lineBreak();
          }
        }
      }, plainText).catch(e => ({ error: e.message }));
      
      await page.waitForTimeout(2000);
      
      const check = await pf.evaluate(() => {
        const se = SmartEditor._editors['blogpc001'];
        return {
          textLen: se.getContentText().length,
          title: se.getDocumentTitle(),
          textSample: se.getContentText().substring(0, 100)
        };
      }).catch(e => ({ error: e.message }));
      console.log('write 결과:', JSON.stringify(check, null, 2));
    }
    
    await ctx.close();
  } catch(e) {
    console.error('FATAL:', e.message);
  }
})();
