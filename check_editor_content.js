const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const pages = ctx.pages();

  for (const p of pages) {
    const f = p.frames().find(ff => ff.url().includes('PostWriteForm'));
    if (!f) continue;
    
    await p.bringToFront();
    await sleep(2000);

    const state = await f.evaluate(() => {
      const r = {};
      // 제목 확인
      const ed = SmartEditor._editors?.blogpc001;
      r.hasEditor = !!ed;
      
      // 현재 제목
      try {
        r.title = ed._documentService?.getDocumentTitle?.() || '';
      } catch(e) { r.title = 'error: ' + e.message; }
      
      // 본문 길이
      try {
        const docHtml = ed._documentService?.getDocumentData?.() || '';
        r.bodyLength = docHtml.length;
        r.bodyPreview = docHtml.substring(0, 200);
      } catch(e) { r.bodyLength = -1; r.bodyError = e.message; }
      
      return r;
    });

    console.log(`=== ${p.url().substring(0, 60)} ===`);
    console.log(`  에디터: ${state.hasEditor ? '✅' : '❌'}`);
    console.log(`  제목: ${state.title?.substring(0, 60) || '(없음)'}`);
    console.log(`  본문: ${state.bodyLength > 0 ? state.bodyLength + '자' : '❌ 비어있음'}`);
    if (state.bodyPreview) console.log(`  미리보기: ${state.bodyPreview.substring(0, 100)}`);
  }

  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));
