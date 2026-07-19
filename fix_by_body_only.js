const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  const baseballTitle = '프로야구 시즌, KBO 구단이 숏폼 하나로 팬을 모으는 법 — 영상 편집 외주로 준비하는 하반기';
  const rainyTitle = '주말 장맛비, 집에서 영상 편집 외주 알아보는 당신에게 — 에이컷이 알려주는 하반기 준비';

  for (const p of ctx.pages()) {
    const f = p.frames().find(ff => ff.url().includes('PostWriteForm'));
    if (!f) continue;

    const bodyFirstLine = await f.evaluate(() => {
      const data = SmartEditor._editors.blogpc001._documentService.getDocumentData();
      const comps = data?.document?.components || [];
      // body text components 찾기 (title 제외)
      for (const c of comps) {
        if (c['@ctype'] === 'text' && c.value) {
          for (const v of c.value) {
            if (v.nodes && v.nodes[0] && v.nodes[0].value) {
              return v.nodes[0].value.substring(0, 50);
            }
          }
        }
        if (c['@ctype'] === 'oglink') continue;
      }
      return 'none';
    });

    const is야구 = bodyFirstLine.includes('프로야구') || bodyFirstLine.includes('KBO');
    const is장마 = bodyFirstLine.includes('장맛비') || bodyFirstLine.includes('주말');
    const is상상 = bodyFirstLine.includes('상상해보세요');

    let newTitle, label;
    if (is장마 && bodyFirstLine.includes('장맛비')) { newTitle = rainyTitle; label = '🌧 장맛비'; }
    else if (is야구 || is상상) { newTitle = baseballTitle; label = '⚾ 프로야구'; }
    else { console.log(`   ❓ "${bodyFirstLine}"`); continue; }

    await f.evaluate((t) => {
      SmartEditor._editors.blogpc001.setDocumentTitle(t);
    }, newTitle);
    console.log(`${label} ✅ "${bodyFirstLine}"`);
    await f.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) if (b.textContent.trim() === '저장') { b.click(); return; }
    });
    await sleep(2000);
  }

  console.log('\n✅ 완료');
  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));
