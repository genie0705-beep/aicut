const { chromium } = require('playwright');
async function run() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();

  for (let ti = 0; ti < pages.length; ti++) {
    const p = pages[ti];
    if (!p.url().includes('PostWriteForm')) continue;
    
    try {
      await p.bringToFront();
      const info = await p.evaluate(() => {
        const editor = window.SmartEditor?._editors?.['blogpc001'];
        if (!editor) return { error: 'editor 없음' };
        const title = editor.getDocumentTitle ? editor.getDocumentTitle() : '-';
        const data = editor.getDocumentData();
        const comps = data?.document?.components || [];
        let textLen = 0, paras = 0, titleComp = false;
        for (const c of comps) {
          if (c['@ctype'] === 'text') {
            for (const para of (c.value || [])) {
              paras++;
              for (const node of (para.nodes || [])) textLen += (node.value || '').length;
            }
          }
          if (c['@ctype'] === 'documentTitle') titleComp = true;
        }
        return { title: title.substring(0, 40), comps: comps.length, paras, textLen, titleComp };
      });
      console.log(`탭 ${ti}:`, JSON.stringify(info));
    } catch(e) {
      console.log(`탭 ${ti}: 에러 ${e.message.substring(0, 50)}`);
    }
  }

  await b.close();
}
run().catch(e => console.error('❌', e.message));
