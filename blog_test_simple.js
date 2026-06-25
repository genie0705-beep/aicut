const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const p = ctx.pages().find(p => p.url().includes('Redirect=Update'));
  await p.bringToFront();
  await p.waitForTimeout(3000);
  const pf = p.frames().find(f => f.url().includes('PostUpdateForm'));
  
  const tests = [
    '<p>테스트</p>',
    '<p class="se-text-paragraph"><span class="__se-node">테스트</span></p>',
    '<div class="se-component se-text se-l-default"><div class="se-component-content"><div class="se-section se-section-text se-l-default"><div class="se-module se-module-text __se-unit"><p class="se-text-paragraph se-text-paragraph-align-center"><span class="se-ff-nanumgothic se-fs32 __se-node">테스트</span></p></div></div></div></div>',
    '테스트',
    '<p><strong>굵은</strong> 텍스트</p>'
  ];
  
  for (let i = 0; i < tests.length; i++) {
    await pf.evaluate(() => {
      const se = SmartEditor._editors['blogpc001'];
      se._documentService.resetDocumentData();
      se.setDocumentTitle('');
    });
    
    const result = await pf.evaluate((html) => {
      try {
        const se = SmartEditor._editors['blogpc001'];
        se._documentService.setDocumentData(html);
        const text = se.getContentText();
        return { ok: true, textLen: text.length, text: text.substring(0, 50) };
      } catch(e) {
        return { ok: false, error: e.message };
      }
    }, tests[i]).catch(e => ({ error: e.message }));
    console.log('Test', i, ':', tests[i].substring(0, 60), '→', JSON.stringify(result));
  }
  
  await ctx.close();
})().catch(e => console.error(e.message));
