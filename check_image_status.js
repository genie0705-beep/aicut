const { chromium } = require('playwright');
const CDP_PORT = 9224;

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  let idx = 0;
  const labels = ['⚾ 프로야구', '🌧 장맛비'];
  for (const p of ctx.pages()) {
    const f = p.frames().find(ff => ff.url().includes('PostWriteForm'));
    if (!f) continue;

    const state = await f.evaluate(() => {
      const data = SmartEditor._editors.blogpc001._documentService.getDocumentData();
      const str = JSON.stringify(data);
      const comps = data?.document?.components || [];
      const imgCount = comps.filter(c => c['@ctype'] === 'image' || c.layout === 'image').length;
      return {
        bodyKB: (str.length / 1024).toFixed(0),
        imgCount,
        hasImages: comps.some(c => c['@ctype'] === 'oglink' || c['@ctype'] === 'image' || c.layout === 'image')
      };
    });

    const hasOglink = state.hasImages;
    console.log(`${labels[idx] || '?'}:`);
    console.log(`  본문: ${state.bodyKB}KB`);
    console.log(`  이미지: ${state.imgCount}개 (oglink 포함: ${hasOglink ? '✅' : '❌'})`);
    idx++;
  }

  console.log('\n※ 이미지가 oglink(링크 카드)로 표시될 수 있음');
  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));
