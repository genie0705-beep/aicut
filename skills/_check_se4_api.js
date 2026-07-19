const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const p = await ctx.newPage();
  
  await p.goto('https://blog.naver.com/aicut/postwrite', {
    waitUntil: 'networkidle',
    timeout: 30000
  });
  await p.waitForTimeout(5000);
  
  // SmartEditor API 확인
  const seInfo = await p.evaluate(() => {
    const info = {};
    
    // SmartEditor._editors 확인
    if (SmartEditor._editors) {
      info.editorKeys = Object.keys(SmartEditor._editors);
      info.editorCount = Object.keys(SmartEditor._editors).length;
      
      // 각 에디터 정보
      info.editors = {};
      for (const key of Object.keys(SmartEditor._editors)) {
        const ed = SmartEditor._editors[key];
        info.editors[key] = {
          type: typeof ed,
          methods: Object.getOwnPropertyNames(Object.getPrototypeOf(ed)).slice(0, 20),
          ownProps: Object.keys(ed).slice(0, 20),
          hasSetTitle: typeof ed.setDocumentTitle,
          hasSetData: typeof ed.setDocumentData,
          hasGetData: typeof ed.getDocumentData,
        };
      }
    } else {
      info.editorKeys = 'no _editors';
      // SmartEditor prototype 확인
      info.SmartEditorProto = Object.getOwnPropertyNames(SmartEditor).slice(0, 20);
    }
    
    // contenteditable div
    const ce = document.querySelector('[contenteditable]');
    if (ce) {
      info.contentEditable = {
        id: ce.id || '(none)',
        cls: ce.className || '(none)',
        tag: ce.tagName,
        role: ce.getAttribute('role'),
        innerHTML_sample: ce.innerHTML.slice(0, 200),
        attributes: Array.from(ce.getAttributeNames ? ce.getAttributeNames() : []),
      };
    }
    
    return info;
  });
  console.log(JSON.stringify(seInfo, null, 2));
  
  // 제목 입력 테스트
  const titleResult = await p.evaluate(() => {
    try {
      SmartEditor._editors['blogpc001'].setDocumentTitle('테스트 제목입니다');
      const title = SmartEditor._editors['blogpc001'].getDocumentTitle();
      return { success: true, title };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
  console.log('제목 테스트:', JSON.stringify(titleResult));
  
  // contenteditable에 텍스트 입력 테스트
  const ceInfo = await p.evaluate(() => {
    const ce = document.querySelector('[contenteditable]');
    if (ce) {
      ce.focus();
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);
      return { focused: document.activeElement === ce, selectionText: sel.toString().slice(0, 100) };
    }
    return { error: 'no contenteditable' };
  });
  console.log('CE 정보:', JSON.stringify(ceInfo));
  
  await b.close();
}

main().catch(e => console.error('❌', e.message));
