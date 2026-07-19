const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  let p = null;
  for (const page of ctx.pages()) {
    if (page.frames().some(f => f.url().includes('PostWriteForm'))) { p = page; break; }
  }
  if (!p) { console.log('탭 없음'); b.close(); return; }

  await p.bringToFront();
  await sleep(2000);
  const f = p.frames().find(f => f.url().includes('PostWriteForm'));

  // SmartEditor 내부 explore
  const info = await f.evaluate(() => {
    const ed = SmartEditor._editors.blogpc001;
    const r = {};

    // _documentService
    if (ed._documentService) {
      const ds = ed._documentService;
      const proto = Object.getOwnPropertyNames(Object.getPrototypeOf(ds));
      r.documentServiceMethods = proto.filter(k => k.includes('set') || k.includes('load') || k.includes('insert')).slice(0, 15);
    }

    // _virtualEditable
    if (ed._virtualEditable) {
      const ve = ed._virtualEditable;
      const proto = Object.getOwnPropertyNames(Object.getPrototypeOf(ve));
      r.virtualEditableMethods = proto.slice(0, 20);
    }

    // _commandManager
    if (ed._commandManager) {
      const cm = ed._commandManager;
      const proto = Object.getOwnPropertyNames(Object.getPrototypeOf(cm));
      r.commandManagerMethods = proto.slice(0, 20);
    }

    // SmartEditor 전역
    r.SEMethods = [];
    if (typeof SmartEditor.setDocumentData === 'function') r.SEMethods.push('SmartEditor.setDocumentData');
    if (typeof SmartEditor.setContents === 'function') r.SEMethods.push('SmartEditor.setContents');
    if (typeof SmartEditor.insertContents === 'function') r.SEMethods.push('SmartEditor.insertContents');

    // _document (현재 문서)
    if (ed._document) {
      const doc = ed._document;
      const docProto = Object.getOwnPropertyNames(Object.getPrototypeOf(doc));
      r.docMethods = docProto.slice(0, 15);
      r.docType = typeof doc;
      r.docKeys = Object.keys(doc).slice(0, 10);
    }

    return r;
  });

  console.log('=== SmartEditor API 탐색 ===');
  console.log(JSON.stringify(info, null, 2));

  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));
