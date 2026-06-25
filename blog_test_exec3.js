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
  
  // 초기화
  await pf.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    se._documentService.resetDocumentData();
    se.setDocumentTitle('execCommand+write 테스트');
  });
  await new Promise(r => setTimeout(r, 2000));
  
  // 방법 1: input_buffer iframe execCommand
  const r1 = await pf.evaluate(() => {
    try {
      const ifr = document.querySelector('iframe[id^="input_buffer"]');
      if (!ifr) return 'no iframe';
      const idoc = ifr.contentDocument || ifr.contentWindow.document;
      const ce = idoc.querySelector('[contenteditable]');
      if (!ce) return 'no ce in iframe';
      ce.focus();
      const r = document.execCommand('insertText', false, 'input_buffer 테스트');
      ce.dispatchEvent(new Event('input', { bubbles: true }));
      return { r, ceText: ce.textContent.substring(0, 50) };
    } catch(e) {
      return { error: e.message };
    }
  });
  console.log('iframe execCommand:', JSON.stringify(r1));
  await new Promise(r => setTimeout(r, 2000));
  
  const check = await pf.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    return { textLen: se.getContentText().length };
  });
  console.log('상태:', JSON.stringify(check));
  
  // 방법 2: write() + input_buffer 이벤트
  await pf.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const es = se._editingService;
    es.write('write 메서드로 입력');
    es.lineBreak();
    es.write('두 번째 줄');
    
    const ifr = document.querySelector('iframe[id^="input_buffer"]');
    if (ifr) {
      try {
        const idoc = ifr.contentDocument || ifr.contentWindow.document;
        const ce = idoc.querySelector('[contenteditable]');
        if (ce) ce.dispatchEvent(new Event('input', { bubbles: true }));
      } catch(e) {}
    }
  });
  await new Promise(r => setTimeout(r, 2000));
  
  const check2 = await pf.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const wrap = document.querySelector('.se-components-wrap');
    const paras = wrap?.querySelectorAll('.se-text-paragraph');
    return {
      textLen: se.getContentText().length,
      paraCount: paras?.length || 0
    };
  });
  console.log('상태2:', JSON.stringify(check2));
  
  await ctx.close();
})().catch(e => console.error('ERR:', e.message));
