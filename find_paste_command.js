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

  const cmdInfo = await f.evaluate(() => {
    const ed = SmartEditor._editors?.blogpc001;
    if (!ed?._commandManager) return {error: 'no cmd manager'};
    
    const cm = ed._commandManager;
    const result = {};
    
    // registerCmd / command 목록 확인
    const keys = Object.keys(cm);
    result.managerKeys = keys;
    
    // loadCommand로 등록된 명령어 조회
    const cmds = [];
    // addCommand로 등록된 명령어들은 prototype에 있을 수 있음
    const proto = Object.getOwnPropertyNames(Object.getPrototypeOf(cm));
    result.protoKeys = proto;
    
    // execCommand 테스트 - 가능한 명령어
    const testCmds = ['paste', 'insertHTML', 'insertText', 'insertContent', 'setContent'];
    for (const c of testCmds) {
      try {
        const cmd = cm.getCommand?.(c);
        result['cmd_' + c] = cmd ? true : false;
      } catch(e) {
        result['cmd_' + c] = 'error: ' + e.message.substring(0, 20);
      }
    }
    
    return result;
  });

  console.log('=== CommandManager ===');
  console.log(JSON.stringify(cmdInfo, null, 2));

  // paste 이벤트를 document에 직접 발생시키는 방법
  console.log('\n=== paste 테스트 ===');
  const pasteTest = await f.evaluate(() => {
    const result = {};
    
    // Method 1: document.execCommand('insertHTML', ...)
    try {
      const sel = window.getSelection();
      result.selectionType = sel ? sel.type : 'no selection';
      result.rangeCount = sel?.rangeCount || 0;
    } catch(e) { result.selError = e.message; }
    
    // Method 2: SmartEditor의 handlePaste 찾기
    const allKeys = Object.keys(SmartEditor._editors?.blogpc001 || {});
    result.pasteKeys = allKeys.filter(k => k.toLowerCase().includes('paste'));
    
    // Method 3: _virtualEditable paste 관련
    const ve = SmartEditor._editors?.blogpc001?._virtualEditable;
    if (ve) {
      const veKeys = Object.keys(ve);
      result.vePasteKeys = veKeys.filter(k => k.toLowerCase().includes('paste'));
    }
    
    return result;
  });
  console.log(JSON.stringify(pasteTest, null, 2));

  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));
