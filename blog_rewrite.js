const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  try {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
    const ctx = browser.contexts()[0];
    const page = ctx.pages().find(p => p.url().includes('Redirect=Update'));
    if (!page) { console.log('페이지 없음'); await ctx.close(); return; }
    await page.bringToFront();
    await page.waitForTimeout(3000);
    
    const pf = page.frames().find(f => f.url().includes('PostUpdateForm'));
    if (!pf) { console.log('PostUpdateForm 없음'); await ctx.close(); return; }
    
    // 1. 기존 내용 지우기 - _documentDataStore 초기화
    const clearResult = await pf.evaluate(() => {
      try {
        const se = SmartEditor._editors['blogpc001'];
        const dds = se._documentService._documentDataStore;
        
        // 제목 초기화
        se.setDocumentTitle('');
        
        // 문서 데이터 리셋
        se._documentService.resetDocumentData();
        
        // DOM 초기화 - se-components-wrap 비우기
        const wrap = document.querySelector('.se-components-wrap');
        if (wrap) wrap.innerHTML = '';
        
        return { ok: true };
      } catch(e) {
        return { ok: false, error: e.message };
      }
    });
    console.log('Clear:', JSON.stringify(clearResult));
    await page.waitForTimeout(1000);
    
    // 2. 모바일 최적화 HTML 준비
    const mobileHtml = fs.readFileSync('C:\\Users\\paul\\.openclaw\\workspace\\blog_aicut_20260625_mobile.html', 'utf-8');
    const bodyMatch = mobileHtml.match(/<body>([\s\S]*?)<\/body>/);
    const contentHtml = bodyMatch ? bodyMatch[1].trim() : mobileHtml;
    
    // 3. SE4에 본문 설정 시도 - setDocumentData
    const setResult = await pf.evaluate((html) => {
      try {
        const se = SmartEditor._editors['blogpc001'];
        // 제목 설정
        se.setDocumentTitle('릴스 알고리즘 2026, 월드컵과 함께하는 AI 영상편집 시대의 숏폼 마케팅 전략');
        // 본문 설정
        se._documentService.setDocumentData(html);
        return { ok: true };
      } catch(e) {
        return { ok: false, error: e.message };
      }
    }, contentHtml);
    console.log('SetData:', JSON.stringify(setResult));
    
    await page.waitForTimeout(3000);
    
    // 4. 결과 확인
    const check = await pf.evaluate(() => {
      const se = SmartEditor._editors['blogpc001'];
      return {
        title: se.getDocumentTitle(),
        textLen: se.getContentText().length,
        domComps: document.querySelectorAll('.se-components-wrap .se-component').length
      };
    });
    console.log('Result:', JSON.stringify(check));
    
    // 5. 저장 버튼 찾기 (상위 페이지)
    const saveBtn = await page.evaluate(() => {
      // PostUpdateForm 외부의 저장 버튼
      const all = document.querySelectorAll('em, button, a, span');
      const btns = [];
      all.forEach(el => {
        const t = (el.textContent || '').trim();
        if (t === '저장' || t === '등록') {
          btns.push({ tag: el.tagName, text: t, cls: (el.className || '').substring(0, 50) });
        }
      });
      return btns;
    });
    console.log('저장 버튼:', JSON.stringify(saveBtn));
    
    await ctx.close();
  } catch(e) {
    console.error('FATAL:', e.message);
  }
})();
