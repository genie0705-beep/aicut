const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  try {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
    const ctx = browser.contexts()[0];
    const page = ctx.pages().find(p => p.url().includes('Redirect=Update'));
    if (!page) { console.log('페이지 없음'); return; }
    await page.bringToFront();
    await page.waitForTimeout(3000);
    
    const pf = page.frames().find(f => f.url().includes('PostUpdateForm'));
    if (!pf) { console.log('PostUpdateForm 없음'); return; }
    
    // 모바일 최적화 HTML 로드
    const html = fs.readFileSync('C:\\Users\\paul\\.openclaw\\workspace\\blog_aicut_20260625_mobile.html', 'utf-8');
    const bodyMatch = html.match(/<body>([\s\S]*?)<\/body>/);
    const bodyContent = bodyMatch ? bodyMatch[1].trim() : html;
    
    // 태그별로 분리하여 텍스트 추출
    const paragraphs = [];
    const tagRegex = /<(h[23]|p)[^>]*>([\s\S]*?)<\/\1>/g;
    let match;
    while ((match = tagRegex.exec(bodyContent)) !== null) {
      const tag = match[1];
      let text = match[2]
        .replace(/<strong>([\s\S]*?)<\/strong>/g, '$1')  // strong 제거
        .replace(/<a[^>]*>([\s\S]*?)<\/a>/g, '$1')       // a 태그 제거
        .replace(/<br\s*\/?>/g, ' ')                      // br → 공백
        .replace(/<[^>]+>/g, '')                          // 나머지 태그 제거
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (text) {
        // h2/h3는 굵은 표시로 처리 (텍스트 앞에 이모지 유지)
        if (tag === 'h2' || tag === 'h3') {
          text = text;
        }
        paragraphs.push(text);
      }
    }
    
    console.log(`총 ${paragraphs.length}개 문단`);
    
    // 에디터 초기화
    await pf.evaluate(() => {
      const se = SmartEditor._editors['blogpc001'];
      se._documentService.resetDocumentData();
      se.setDocumentTitle('릴스 알고리즘 2026, 월드컵과 함께하는 AI 영상편집 시대의 숏폼 마케팅 전략');
    });
    await page.waitForTimeout(2000);
    
    // focus 주고 write로 하나씩 입력
    await pf.evaluate((paras) => {
      const se = SmartEditor._editors['blogpc001'];
      se._canvasScrollingService.focusToFirstComp();
      
      const es = se._editingService;
      
      for (let i = 0; i < paras.length; i++) {
        es.write(paras[i]);
        if (i < paras.length - 1) {
          es.lineBreak();
          // 문단 사이 빈 줄 추가
          es.lineBreak();
        }
      }
    }, paragraphs).catch(e => ({ error: e.message }));
    
    await page.waitForTimeout(3000);
    
    // 결과 확인
    const check = await pf.evaluate(() => {
      const se = SmartEditor._editors['blogpc001'];
      return {
        title: se.getDocumentTitle(),
        textLen: se.getContentText().length,
        textSample: se.getContentText().substring(0, 200)
      };
    }).catch(e => ({ error: e.message }));
    console.log('입력 결과:', JSON.stringify(check, null, 2));
    
    if (check.textLen > 100) {
      console.log('\n✅ 본문 입력 완료!');
      console.log(`총 ${check.textLen}자 입력됨`);
      console.log('제목:', check.title);
    }
    
    await ctx.close();
  } catch(e) {
    console.error('FATAL:', e.message);
  }
})();
