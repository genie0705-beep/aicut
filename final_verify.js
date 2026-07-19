const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  let idx = 0;
  for (const p of ctx.pages()) {
    const f = p.frames().find(ff => ff.url().includes('PostWriteForm'));
    if (!f) continue;

    await p.bringToFront();
    await sleep(2000);

    const state = await f.evaluate(() => {
      const ed = SmartEditor._editors?.blogpc001;
      if (!ed?._documentService) return {error: 'no service'};
      try {
        const data = ed._documentService.getDocumentData();
        const jsonStr = JSON.stringify(data);
        const title = ed._documentService.getDocumentTitle();
        return {
          title: title?.substring(0, 50),
          bodyLen: jsonStr.length,
          hasContent: jsonStr.length > 500,
          components: data?.document?.components?.length || 0
        };
      } catch(e) { return {error: e.message}; }
    });

    const names = ['⚾ 프로야구', '🌧 장맛비'];
    console.log(`${names[idx] || '?'}:`);
    console.log(`  제목: ${state.title || '(없음)'}${state.title ? ' ✅' : ' ❌'}`);
    console.log(`  본문: ${state.hasContent ? '✅ ' + (state.bodyLen/1024).toFixed(0) + 'KB' : '❌ 비어있음'}`);
    console.log(`  구성요소: ${state.components}개`);
    idx++;
  }

  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));
