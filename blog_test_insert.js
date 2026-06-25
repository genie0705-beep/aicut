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
    
    // 리셋 후 제목 설정
    await pf.evaluate(() => {
      const se = SmartEditor._editors['blogpc001'];
      se._documentService.resetDocumentData();
      se.setDocumentTitle('릴스 알고리즘 2026, 월드컵과 함께하는 AI 영상편집 시대의 숏폼 마케팅 전략');
    });
    await page.waitForTimeout(2000);
    
    // insertByExternalPaste - 다양한 인자 형식 테스트
    const tests = [
      { name: '문자열 HTML', fn: () => pf.evaluate(() => {
        const es = SmartEditor._editors['blogpc001']._editingService;
        es.insertByExternalPaste('<p>테스트1</p>');
        return SmartEditor._editors['blogpc001'].getContentText().length;
      })},
      { name: '객체 html', fn: () => pf.evaluate(() => {
        const es = SmartEditor._editors['blogpc001']._editingService;
        es.insertByExternalPaste({ html: '테스트2' });
        return SmartEditor._editors['blogpc001'].getContentText().length;
      })},
      { name: '객체 html+plain', fn: () => pf.evaluate(() => {
        const es = SmartEditor._editors['blogpc001']._editingService;
        es.insertByExternalPaste({ html: '<p>테스트3</p>', plain: '테스트3' });
        return SmartEditor._editors['blogpc001'].getContentText().length;
      })}
    ];
    
    for (const test of tests) {
      await pf.evaluate(() => {
        const se = SmartEditor._editors['blogpc001'];
        se._documentService.resetDocumentData();
        se.setDocumentTitle('');
      });
      await page.waitForTimeout(1000);
      
      const len = await test.fn().catch(e => 'err:' + e.message);
      console.log(`${test.name}: textLen=${len}`);
      await page.waitForTimeout(1000);
    }
    
    await ctx.close();
  } catch(e) {
    console.error('FATAL:', e.message);
  }
})();
