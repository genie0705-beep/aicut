const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  let tab = null;
  for (const p of ctx.pages()) {
    if (p.frames().some(f => f.url().includes('PostWriteForm'))) { tab = p; break; }
  }
  if (!tab) { console.log('탭 없음'); b.close(); return; }

  await tab.bringToFront();
  await sleep(2000);
  const f = tab.frames().find(ff => ff.url().includes('PostWriteForm'));

  // SmartEditor 에디터 구조 깊이 탐색
  const edInfo = await f.evaluate(() => {
    const ed = SmartEditor._editors?.blogpc001;
    if (!ed) return { error: 'ed 없음' };

    const result = {};

    // 모든 프로퍼티에서 editor element 찾기
    const keys = Object.keys(ed);
    result.editorKeys = keys.slice(0, 40);

    // _virtualEditable 내부
    if (ed._virtualEditable) {
      const ve = ed._virtualEditable;
      const veKeys = Object.keys(ve);
      result.veKeys = veKeys.slice(0, 20);
      
      // element 관련 찾기
      for (const k of veKeys) {
        const v = ve[k];
        if (v && typeof v === 'object' && v.tagName) {
          result['ve.' + k] = v.tagName + '#' + (v.id || '') + '.' + (v.className || '').substring(0, 30);
        }
      }
    }

    // _canvasEditable, _editableElement 등
    for (const prefix of ['_canvas', '_edit', '_doc', '_body', '_root']) {
      for (const k of keys) {
        if (k.startsWith(prefix)) {
          const v = ed[k];
          if (v && typeof v === 'object' && v.tagName) {
            result['ed.' + k] = v.tagName + '#' + (v.id || '');
          }
        }
      }
    }

    // 모든 자식 요소 중 editor body 역할 하는 요소 스캔
    const bodyChildren = document.body.querySelectorAll('*');
    const editorRelated = [];
    for (const el of bodyChildren) {
      const cls = el.className || '';
      const id = el.id || '';
      if (cls.toLowerCase().includes('editor') || cls.toLowerCase().includes('edit') || 
          id.toLowerCase().includes('editor') || id.toLowerCase().includes('edit') ||
          el.hasAttribute('contenteditable') || el.isContentEditable) {
        editorRelated.push({
          tag: el.tagName,
          id: id,
          cls: cls.substring(0, 40),
          editable: el.isContentEditable,
          visible: el.offsetParent !== null,
          textLen: el.textContent.trim().length
        });
      }
    }
    result.editorElements = editorRelated.slice(0, 20);

    return result;
  });

  console.log('=== 에디터 구조 ===');
  console.log(JSON.stringify(edInfo, null, 2));

  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));
