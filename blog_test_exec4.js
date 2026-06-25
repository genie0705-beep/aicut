const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const p = ctx.pages().find(p => p.url().includes('Redirect=Update'));
  if (!p) { await ctx.close(); return; }
  await p.bringToFront();
  await p.waitForTimeout(3000);
  const pf = p.frames().find(f => f.url().includes('PostUpdateForm'));
  if (!pf) { await ctx.close(); return; }
  
  // 새 탭 열기 (깨끗한 상태)
  const fresh = await ctx.newPage();
  await fresh.goto('https://blog.naver.com/aicut?Redirect=Update&logNo=224326578253', { timeout: 30000, waitUntil: 'domcontentloaded' }).catch(() => {});
  await fresh.waitForTimeout(5000);
  const pf2 = fresh.frames().find(f => f.url().includes('PostUpdateForm'));
  if (!pf2) { console.log('PostUpdateForm 없음'); await ctx.close(); return; }
  console.log('새 탭 로드 완료');
  
  // execCommand + focusToFirstComp 먼저
  const r1 = await pf2.evaluate(() => {
    try {
      const se = SmartEditor._editors['blogpc001'];
      se._documentService.resetDocumentData();
      se.setDocumentTitle('execCommand 테스트');
      se._canvasScrollingService.focusToFirstComp();
      return 'reset OK';
    } catch(e) {
      return 'reset error: ' + e.message;
    }
  });
  console.log('초기화:', r1);
  await new Promise(r => setTimeout(r, 2000));
  
  // write() 호출 (focusToFirstComp 후)
  const r2 = await pf2.evaluate(() => {
    try {
      const se = SmartEditor._editors['blogpc001'];
      const es = se._editingService;
      es.write('write 성공 테스트');
      es.lineBreak();
      es.write('두 번째 줄');
      return { ok: true, textLen: se.getContentText().length };
    } catch(e) {
      return { error: e.message };
    }
  });
  console.log('write():', JSON.stringify(r2));
  await new Promise(r => setTimeout(r, 2000));
  
  // paragraph 확인
  const check = await pf2.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const wrap = document.querySelector('.se-components-wrap');
    const paras = wrap?.querySelectorAll('.se-text-paragraph');
    return {
      textLen: se.getContentText().length,
      paraCount: paras?.length || 0,
      firstPara: paras?.[0]?.textContent?.substring(0, 30)
    };
  });
  console.log('paragraph 확인:', JSON.stringify(check));
  
  await ctx.close();
})().catch(e => console.error('ERR:', e.message));
