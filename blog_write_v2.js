const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  try {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
    const ctx = browser.contexts()[0];
    
    // 수정 페이지 열기
    const page = await ctx.newPage();
    await page.goto('https://blog.naver.com/aicut?Redirect=Update&logNo=224326578253', {
      timeout: 30000, waitUntil: 'domcontentloaded'
    }).catch(() => {});
    console.log('페이지 로드:', page.url().substring(0, 80));
    await page.waitForTimeout(6000);
    
    const pf = page.frames().find(f => f.url().includes('PostUpdateForm'));
    if (!pf) {
      console.log('PostUpdateForm 없음');
      for (const f of page.frames()) {
        if (!f.url().startsWith('about:blank'))
          console.log('프레임:', f.url().substring(0, 100));
      }
      await ctx.close();
      return;
    }
    console.log('PostUpdateForm 발견');
    
    // 모바일 최적화 HTML → 문단 추출
    const html = fs.readFileSync('C:\\Users\\paul\\.openclaw\\workspace\\blog_aicut_20260625_mobile.html', 'utf-8');
    const bodyMatch = html.match(/<body>([\s\S]*?)<\/body>/);
    const bodyContent = bodyMatch ? bodyMatch[1].trim() : html;
    
    const paragraphs = [];
    const tagRegex = /<(h[23]|p)[^>]*>([\s\S]*?)<\/\1>/g;
    let match;
    while ((match = tagRegex.exec(bodyContent)) !== null) {
      let text = match[2]
        .replace(/<strong>([\s\S]*?)<\/strong>/g, '$1')
        .replace(/<a[^>]*>([\s\S]*?)<\/a>/g, '$1')
        .replace(/<br\s*\/?>/g, ' ')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/\s+/g, ' ').trim();
      if (text) paragraphs.push(text);
    }
    console.log(`총 ${paragraphs.length}개 문단`);
    
    // 에디터 초기화
    await pf.evaluate(() => {
      const se = SmartEditor._editors['blogpc001'];
      se._documentService.resetDocumentData();
      se.setDocumentTitle('릴스 알고리즘 2026, 월드컵과 함께하는 AI 영상편집 시대의 숏폼 마케팅 전략');
    });
    await page.waitForTimeout(2000);
    
    // write()로 직접 입력
    await pf.evaluate((paras) => {
      const se = SmartEditor._editors['blogpc001'];
      se._canvasScrollingService.focusToFirstComp();
      const es = se._editingService;
      
      for (let i = 0; i < paras.length; i++) {
        es.write(paras[i]);
        if (i < paras.length - 1) {
          es.lineBreak();
          es.lineBreak(); // 문단 사이 빈 줄
        }
      }
    }, paragraphs);
    
    await page.waitForTimeout(3000);
    
    // 결과
    const check = await pf.evaluate(() => {
      const se = SmartEditor._editors['blogpc001'];
      return {
        title: se.getDocumentTitle(),
        textLen: se.getContentText().length,
        sample: se.getContentText().substring(0, 100)
      };
    });
    console.log('✅ 입력 완료:', JSON.stringify(check, null, 2));
    
    await ctx.close();
  } catch(e) {
    console.error('FATAL:', e.message);
  }
})();
