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
  
  // 1. contenteditable 찾기
  const ceInfo = await pf.evaluate(() => {
    const all = document.querySelectorAll('[contenteditable], .se-module-text, .__se-unit');
    const list = [];
    all.forEach(el => {
      list.push({
        tag: el.tagName,
        id: (el.id || '').substring(0, 30),
        cls: (el.className || '').substring(0, 50),
        ce: el.getAttribute('contenteditable'),
        visible: el.getBoundingClientRect().width > 0
      });
    });
    return list;
  });
  console.log('CE 요소:', JSON.stringify(ceInfo, null, 2));
  
  // 2. input_buffer iframe 내용
  const ibContent = await pf.evaluate(() => {
    const ifr = document.querySelector('iframe[id^="input_buffer"]');
    if (!ifr) return 'no input_buffer';
    try {
      const doc = ifr.contentDocument || ifr.contentWindow.document;
      return {
        id: ifr.id,
        bodyLen: doc.body.innerHTML.length,
        bodySample: doc.body.innerHTML.substring(0, 200),
        hasCE: !!doc.querySelector('[contenteditable]')
      };
    } catch(e) {
      return { error: e.message };
    }
  });
  console.log('input_buffer:', JSON.stringify(ibContent, null, 2));
  
  // 3. SmartEditor virtual editable 확인
  const veInfo = await pf.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const ve = se._virtualEditable;
    if (!ve) return { hasVE: false };
    
    // 모든 속성 탐색
    const props = {};
    Object.keys(ve).forEach(k => {
      const v = ve[k];
      if (k === '_el' || k.includes('el') || k.includes('node') || k.includes('elem') || k.includes('target')) {
        props[k] = v ? (v.tagName || typeof v) : null;
      }
    });
    
    return { hasVE: true, props };
  });
  console.log('VirtualEditable:', JSON.stringify(veInfo, null, 2));
  
  // 4. execCommand 테스트
  const test = await pf.evaluate(() => {
    try {
      const se = SmartEditor._editors['blogpc001'];
      se._documentService.resetDocumentData();
      se.setDocumentTitle('execCommand 테스트');
      se._canvasScrollingService.focusToFirstComp();
      
      // execCommand 실행
      const r1 = document.execCommand('insertText', false, '첫 번째 문단입니다.');
      const r2 = document.execCommand('insertText', false, '\n');
      const r3 = document.execCommand('insertText', false, '두 번째 문단입니다.');
      
      // input 이벤트 dispatch
      const active = document.activeElement;
      if (active) {
        active.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true }));
      }
      
      return {
        r1, r2, r3,
        textLen: se.getContentText().length,
        textSample: se.getContentText().substring(0, 50),
        activeTag: active ? active.tagName + '#' + (active.id || '') : 'none'
      };
    } catch(e) {
      return { error: e.message, stack: e.stack?.substring(0, 200) };
    }
  });
  console.log('execCommand 결과:', JSON.stringify(test, null, 2));
  
  await ctx.close();
})().catch(e => console.error('ERR:', e.message));
