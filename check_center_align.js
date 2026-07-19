const { chromium } = require('playwright');
const CDP_PORT = 9224;

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  for (const p of ctx.pages()) {
    const f = p.frames().find(ff => ff.url().includes('PostWriteForm'));
    if (!f) continue;

    const alignInfo = await f.evaluate(() => {
      const ed = SmartEditor._editors?.blogpc001;
      if (!ed?._documentService) return null;
      const data = ed._documentService.getDocumentData();
      const comps = data?.document?.components || [];
      
      // align 확인
      let bodyCount = 0;
      let centerCount = 0;
      let alignDetails = [];

      for (const c of comps) {
        if (c['@ctype'] === 'text' && c.value) {
          for (const v of c.value) {
            bodyCount++;
            const hasAlign = v.style?.align === 'center';
            if (hasAlign) centerCount++;
            if (bodyCount <= 3) {
              alignDetails.push({
                text: v.nodes?.[0]?.value?.substring(0, 30) || '',
                hasStyle: !!v.style,
                align: v.style?.align || 'none'
              });
            }
          }
        }
      }
      
      return {
        title: ed._documentService.getDocumentTitle()?.substring(0, 30),
        bodyParagraphs: bodyCount,
        centerAligned: centerCount,
        notAligned: bodyCount - centerCount,
        details: alignDetails
      };
    });

    if (!alignInfo) continue;
    
    const label = (alignInfo.title || '').includes('프로야구') ? '⚾ 프로야구' : '🌧 장맛비';
    console.log(`\n━━━ ${label} ━━━`);
    console.log(`  본문 문단: ${alignInfo.bodyParagraphs}개`);
    console.log(`  가운데 정렬: ${alignInfo.centerAligned}개`);
    console.log(`  미정렬: ${alignInfo.notAligned}개`);
    console.log(`  결과: ${alignInfo.centerAligned === alignInfo.bodyParagraphs ? '✅ 모두 정렬됨' : '⚠️ 불완전'}`);
    console.log(`  상세:`);
    alignInfo.details.forEach(d => console.log(`    "${d.text}" → align:${d.align}`));
  }

  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));
