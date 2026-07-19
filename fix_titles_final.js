const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  const baseballTitle = '프로야구 시즌, KBO 구단이 숏폼 하나로 팬을 모으는 법 — 영상 편집 외주로 준비하는 하반기';
  const rainyTitle = '주말 장맛비, 집에서 영상 편집 외주 알아보는 당신에게 — 에이컷이 알려주는 하반기 준비';

  const editors = [];
  for (const p of ctx.pages()) {
    const f = p.frames().find(ff => ff.url().includes('PostWriteForm'));
    if (!f) continue;
    const info = await f.evaluate(() => {
      const str = JSON.stringify(SmartEditor._editors.blogpc001._documentService.getDocumentData());
      return { len: str.length, body: str.substring(0, 3000) };
    });
    if (info) editors.push({ page: p, frame: f, ...info });
  }

  editors.sort((a, b) => b.len - a.len);
  const mainEditors = editors.filter(e => e.len > 5000).slice(0, 2);

  for (const ed of mainEditors) {
    const text = ed.body;
    const has야구 = text.includes('프로야구') || text.includes('KBO') || text.includes('홈런');
    const has장마 = text.includes('장맛비') || text.includes('장마') || text.includes('비 오는');
    const startsWith장맛비 = text.includes('주말 장맛비, 딱 좋은');

    let newTitle, label;
    if (startsWith장맛비) { newTitle = rainyTitle; label = '🌧 장맛비'; }
    else if (has장마 && !has야구) { newTitle = rainyTitle; label = '🌧 장맛비'; }
    else if (has야구) { newTitle = baseballTitle; label = '⚾ 프로야구'; }
    else { console.log(`❓ 판단 불가: ${text.substring(0, 100)}`); continue; }

    await ed.frame.evaluate((t) => {
      SmartEditor._editors.blogpc001.setDocumentTitle(t);
    }, newTitle);
    console.log(`${label} ✅`);
    await ed.frame.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) if (b.textContent.trim() === '저장') { b.click(); return; }
    });
    await sleep(2000);
  }

  console.log('\n✅ 완료');
  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));
