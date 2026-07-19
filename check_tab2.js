const { chromium } = require('playwright');
const CDP_PORT = 9224;

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  let idx = 0;
  for (const p of ctx.pages()) {
    const f = p.frames().find(ff => ff.url().includes('PostWriteForm'));
    if (!f) continue;
    if (idx !== 1) { idx++; continue; }

    const text = await f.evaluate(() => {
      return JSON.stringify(SmartEditor._editors.blogpc001._documentService.getDocumentData()).substring(0, 3000);
    });

    console.log('=== 탭 1 body (19KB) ===');
    console.log(text.substring(0, 2000));
    idx++;
  }

  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));
