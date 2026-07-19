const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  let found = false;
  for (const p of ctx.pages()) {
    const f = p.frames().find(ff => ff.url().includes('PostWriteForm'));
    if (!f) continue;

    const cmds = await f.evaluate(() => {
      const ed = SmartEditor._editors?.blogpc001;
      if (!ed?._commandManager) return null;
      
      const cm = ed._commandManager;
      const available = [];
      const testCmds = ['alignCenter', 'alignLeft', 'alignRight', 'justifyCenter', 'justifyLeft', 'justifyRight', 'setAlign', 'center'];
      
      for (const c of testCmds) {
        try {
          const cmd = cm.getCommand(c);
          if (cmd) available.push(c);
        } catch(e) {}
        
        // try execCommand
        try {
          cm.execCommand(c);
          available.push('exec:' + c);
        } catch(e) {}
      }
      
      return { available };
    });

    if (cmds) {
      console.log('가능한 정렬 명령어:', JSON.stringify(cmds));
      found = true;
    }
  }

  if (!found) console.log('에디터 없음');
  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));
