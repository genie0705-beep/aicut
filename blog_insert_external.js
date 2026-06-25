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
    if (!pf) { console.log('PostUpdateForm 없음'); await ctx.close(); return; }
    
    // 모바일 최적화 HTML
    const mobileHtml = fs.readFileSync('C:\\Users\\paul\\.openclaw\\workspace\\blog_aicut_20260625_mobile.html', 'utf-8');
    const bodyMatch = mobileHtml.match(/<body>([\s\S]*?)<\/body>/);
    const contentHtml = bodyMatch ? bodyMatch[1].trim() : mobileHtml;
    
    // 제목 먼저 설정
    await pf.evaluate(() => {
      const se = SmartEditor._editors['blogpc001'];
      se.setDocumentTitle('릴스 알고리즘 2026, 월드컵과 함께하는 AI 영상편집 시대의 숏폼 마케팅 전략');
    });
    
    // 방법 1: _editingService.insertByExternalPaste 시도
    console.log('방법 1: insertByExternalPaste 시도');
    const result1 = await pf.evaluate((html) => {
      try {
        const se = SmartEditor._editors['blogpc001'];
        const es = se._editingService;
        if (typeof es.insertByExternalPaste === 'function') {
          es.insertByExternalPaste({ html: html });
          return { ok: true, textLen: se.getContentText().length };
        }
        return { ok: false, msg: 'insertByExternalPaste 없음' };
      } catch(e) {
        return { ok: false, error: e.message };
      }
    }, contentHtml).catch(e => ({ error: e.message }));
    console.log('결과1:', JSON.stringify(result1, null, 2));
    
    // 실패 시 방법 2: _editingService.write로 텍스트 직접 쓰기
    if (!result1.ok || (result1.ok && result1.textLen < 100)) {
      console.log('\n방법 2: _editingService.write 시도');
      
      // 태그별로 텍스트 추출
      const parser = new (require('simple-html-tokenizer') || class { tokenize(s) { return []; } })();
      // 수동 파싱
      const textParts = [];
      const tagRegex = /<(h[23]|p)[^>]*>([\s\S]*?)<\/\1>/g;
      let match;
      while ((match = tagRegex.exec(contentHtml)) !== null) {
        const text = match[2].replace(/<[^>]+>/g, '').trim();
        if (text) {
          textParts.push({ tag: match[1], text });
        }
      }
      
      console.log(`총 ${textParts.length}개 텍스트 파트`);
      
      // 먼저 내용 초기화
      await pf.evaluate(() => {
        const se = SmartEditor._editors['blogpc001'];
        se._documentService.resetDocumentData();
        se.setDocumentTitle('릴스 알고리즘 2026, 월드컵과 함께하는 AI 영상편집 시대의 숏폼 마케팅 전략');
      }).catch(() => {});
      await page.waitForTimeout(2000);
      
      // 하나씩 write
      for (let i = 0; i < Math.min(textParts.length, 5); i++) {
        const part = textParts[i];
        await pf.evaluate(({ text, tag }) => {
          try {
            const es = SmartEditor._editors['blogpc001']._editingService;
            
            // h2/h3는 굵은 텍스트로 처리
            if (tag === 'h2' || tag === 'h3') {
              es.write(text);
            } else {
              es.write(text);
            }
            
            // 줄바꿈
            es.lineBreak();
          } catch(e) {
            console.error('write error:', e.message);
          }
        }, part).catch(() => {});
        await page.waitForTimeout(300);
      }
      
      const check2 = await pf.evaluate(() => {
        const se = SmartEditor._editors['blogpc001'];
        return { textLen: se.getContentText().length };
      }).catch(() => ({}));
      console.log('결과2:', JSON.stringify(check2));
    }
    
    await ctx.close();
  } catch(e) {
    console.error('FATAL:', e.message);
    console.error(e.stack);
  }
})();
