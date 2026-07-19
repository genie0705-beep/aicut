const { chromium } = require('playwright');
const CDP_PORT = 9224;

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  let idx = 0;
  for (const p of ctx.pages()) {
    const f = p.frames().find(ff => ff.url().includes('PostWriteForm'));
    if (!f) continue;

    const info = await f.evaluate(() => {
      const ed = SmartEditor._editors?.blogpc001;
      if (!ed?._documentService) return null;
      const data = ed._documentService.getDocumentData();
      const comps = data?.document?.components || [];
      
      // body 첫 줄
      let firstLine = '';
      for (const c of comps) {
        if (c['@ctype'] === 'text' && c.value) {
          for (const v of c.value) {
            if (v.nodes && v.nodes[0] && v.nodes[0].value) {
              firstLine = v.nodes[0].value.substring(0, 60);
              break;
            }
          }
        }
        if (firstLine) break;
      }
      
      return {
        title: ed._documentService.getDocumentTitle()?.substring(0, 40) || '',
        bodyFirstLine: firstLine,
        bodyLen: JSON.stringify(data).length,
        imgCount: comps.filter(c => c['@ctype'] === 'oglink' || c.layout === 'image').length
      };
    });

    if (info) {
      console.log(`[${idx}] 제목:${info.title.substring(0, 30)}...`);
      console.log(`     첫줄:${info.bodyFirstLine.substring(0, 50)}`);
      console.log(`     크기:${(info.bodyLen/1024).toFixed(0)}KB 이미지:${info.imgCount}개`);
    }
    idx++;
  }

  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));
