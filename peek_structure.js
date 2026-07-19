const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  for (const p of ctx.pages()) {
    const f = p.frames().find(ff => ff.url().includes('PostWriteForm'));
    if (!f) continue;

    const deep = await f.evaluate(() => {
      const data = SmartEditor._editors.blogpc001._documentService.getDocumentData();
      const full = JSON.stringify(data);
      
      // components 내용 분석
      const comps = data?.document?.components || [];
      const result = [];
      for (let ci = 0; ci < Math.min(comps.length, 5); ci++) {
        const c = comps[ci];
        result.push({
          idx: ci,
          type: c['@ctype'],
          keys: Object.keys(c),
          preview: JSON.stringify(c).substring(0, 200)
        });
      }
      
      return {
        totalComps: comps.length,
        docLen: full.length,
        comps: result,
        // 5000자 깊이 들어가서 찾기
        fullPreview: full.substring(0, 5000)
      };
    });

    console.log(`=== 문서 구조 ===`);
    console.log(`구성요소: ${deep.totalComps}개, 문서크기: ${deep.docLen}자`);
    console.log(`\n컴포넌트 분석:`);
    deep.comps.forEach(c => console.log(`  [${c.idx}] @ctype=${c.type} | ${c.preview}`));
    console.log(`\n전체 미리보기 (5000자):`);
    console.log(deep.fullPreview.substring(0, 2000));
    
    break; // 첫 번째 탭만
  }

  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));
