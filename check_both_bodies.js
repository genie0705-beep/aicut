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

    const preview = await f.evaluate(() => {
      const data = SmartEditor._editors.blogpc001._documentService.getDocumentData();
      const str = JSON.stringify(data);
      
      // body text 찾기 (paragraph 내용)
      const comps = data?.document?.components || [];
      let bodyText = '';
      for (const c of comps) {
        if (c['@ctype'] === 'textNode' && c.value) {
          bodyText += c.value + ' ';
        }
        // paragraphs
        if (c.nodes) {
          for (const n of c.nodes) {
            if (n.value) bodyText += n.value + ' ';
            if (n.nodes) {
              for (const nn of n.nodes) {
                if (nn.value) bodyText += nn.value + ' ';
              }
            }
          }
        }
      }
      
      return {
        title: data?.document?.components?.[0]?.title?.[0]?.nodes?.[0]?.value || '',
        bodyPreview: bodyText.substring(0, 300),
        bodyLen: str.length
      };
    });

    const has야구 = preview.bodyPreview.includes('야구') || preview.bodyPreview.includes('KBO');
    const has장마 = preview.bodyPreview.includes('장마') || preview.bodyPreview.includes('장맛비') || preview.bodyPreview.includes('비 오');

    console.log(`\n[탭 ${idx}] 본문 ${(preview.bodyLen/1024).toFixed(0)}KB`);
    console.log(`  제목: ${preview.title.substring(0, 40)}`);
    console.log(`  야구: ${has야구 ? '✅' : '❌'} | 장마: ${has장마 ? '✅' : '❌'}`);
    console.log(`  내용: ${preview.bodyPreview.substring(0, 150)}`);
    idx++;
  }

  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));
