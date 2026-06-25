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
  
  // 1. contenteditable=true 요소 상세 확인
  const ceDetail = await pf.evaluate(() => {
    const ce = document.querySelector('[contenteditable="true"]');
    if (!ce) return 'not found';
    return {
      tag: ce.tagName,
      id: ce.id,
      cls: ce.className,
      parentTag: ce.parentElement?.tagName,
      parentCls: ce.parentElement?.className?.substring(0, 60),
      innerLen: ce.innerHTML.length,
      textLen: ce.textContent.length,
      innerSample: ce.innerHTML.substring(0, 100),
      rect: ce.getBoundingClientRect().toJSON()
    };
  });
  console.log('CE 상세:', JSON.stringify(ceDetail, null, 2));
  
  // 2. _elementFinder 확인
  const efInfo = await pf.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const ve = se._virtualEditable;
    const ef = ve._elementFinder;
    if (typeof ef === 'function') {
      try {
        const el = ef();
        return {
          type: 'function',
          resultTag: el?.tagName || 'null',
          resultId: el?.id || '',
          resultCls: el?.className?.substring(0, 50) || ''
        };
      } catch(e) {
        return { type: 'function', error: e.message };
      }
    }
    return { type: typeof ef, value: String(ef).substring(0, 100) };
  });
  console.log('_elementFinder:', JSON.stringify(efInfo, null, 2));
  
  // 3. execCommand 테스트 (reset 없이 직접)
  const test = await pf.evaluate(() => {
    try {
      const ce = document.querySelector('[contenteditable="true"]');
      if (!ce) return 'no contenteditable';
      
      ce.focus();
      
      const r1 = document.execCommand('insertText', false, 'execCommand로 입력한 텍스트입니다.');
      
      // input 이벤트
      ce.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true }));
      
      const se = SmartEditor._editors['blogpc001'];
      return {
        r1,
        textLen: se.getContentText().length,
        textSample: se.getContentText().substring(0, 50),
        ceTextLen: ce.textContent.length
      };
    } catch(e) {
      return { error: e.message };
    }
  });
  console.log('execCommand:', JSON.stringify(test, null, 2));
  
  await ctx.close();
})().catch(e => console.error('ERR:', e.message));
