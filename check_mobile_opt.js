const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  const labels = ['⚾ 프로야구', '🌧 장맛비'];
  let idx = 0;

  for (const p of ctx.pages()) {
    const f = p.frames().find(ff => ff.url().includes('PostWriteForm'));
    if (!f) continue;

    await p.bringToFront();
    await sleep(1000);

    const textData = await f.evaluate(() => {
      const ed = SmartEditor._editors?.blogpc001;
      if (!ed?._documentService) return null;
      const data = ed._documentService.getDocumentData();
      const comps = data?.document?.components || [];

      // 모든 paragraph 텍스트 추출
      const paragraphs = [];
      for (const c of comps) {
        if (c['@ctype'] === 'text' && c.value) {
          for (const v of c.value) {
            if (v.nodes) {
              for (const n of v.nodes) {
                if (n.value) paragraphs.push(n.value);
              }
            }
          }
        }
      }

      return { paragraphs, count: paragraphs.length };
    });

    if (!textData || textData.count < 5) continue;

    const label = labels[idx] || '?';
    const texts = textData.paragraphs;

    // 모바일 360px 기준: 한글 1자 ≈ 14px, 한 줄 최대 약 25자
    // 2~3줄 = 50~75자 한계
    const maxIdeal = 50;  // 3줄 이내

    const over50 = texts.filter(t => t.length > 50);
    const over75 = texts.filter(t => t.length > 75);
    const maxLen = Math.max(...texts.map(t => t.length));
    const avgLen = Math.round(texts.reduce((a,t) => a + t.length, 0) / texts.length);

    console.log(`\n━━━ ${label} 모바일 최적화 ━━━`);
    console.log(`  총 문단: ${texts.length}개`);
    console.log(`  평균 길이: ${avgLen}자`);
    console.log(`  최대 길이: ${maxLen}자`);
    console.log(`  50자 초과: ${over50.length}개`);
    console.log(`  75자 초과: ${over75.length}개`);

    if (over50.length > 0) {
      console.log(`  50자 초과 문단:`);
      over50.slice(0, 5).forEach(t => console.log(`    "${t.substring(0, 60)}..." (${t.length}자)`));
    }

    // 모바일 최적화 판정
    const mobilePass = over50.length === 0;
    console.log(`\n  📱 모바일 최적화: ${mobilePass ? '✅ 통과' : '⚠️ 보완 필요 (50자↓ 권장)'}`);
    console.log(`  ※ 해시태그 라인(30개)은 50자 초과 가능`);

    idx++;
  }

  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));
