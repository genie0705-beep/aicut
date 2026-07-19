const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  for (const p of ctx.pages()) {
    const f = p.frames().find(ff => ff.url().includes('PostWriteForm'));
    if (!f) continue;
    await p.bringToFront();
    await sleep(1500);

    const title = await f.evaluate(() => {
      try { return SmartEditor._editors.blogpc001._documentService.getDocumentTitle() || ''; } catch(e) { return ''; }
    });
    if (!title.includes('프로야구') && !title.includes('장맛비')) continue;
    const label = title.includes('프로야구') ? '⚾' : '🌧';

    // SmartEditor 내부 렌더러로 직접 center align 적용
    const result = await f.evaluate(() => {
      const ed = SmartEditor._editors.blogpc001;
      if (!ed) return 'no editor';

      // 방법: 각 paragraph 컴포넌트의 style.align을 center로 설정
      const data = ed._documentService.getDocumentData();
      const comps = data?.document?.components || [];
      let count = 0;

      for (const c of comps) {
        if (c['@ctype'] === 'text' && c.value) {
          for (const v of c.value) {
            if (!v.style) {
              v.style = { '@ctype': 'paragraphStyle', align: 'center' };
            } else {
              v.style.align = 'center';
            }
            count++;
          }
        }
      }

      // 렌더러 업데이트 (렌더러가 변경사항을 적용하게 함)
      try { ed._renderer?.render(); } catch(e) {}
      
      return `applied to ${count} paragraphs`;
    });

    console.log(`${label} ✅ ${result}`);

    // 정렬 버튼으로도 시도
    try {
      await f.evaluate(() => {
        const btns = document.querySelectorAll('button');
        for (const b of btns) {
          if (b.textContent.trim().includes('정렬') && b.className.includes('toolbar')) {
            b.click(); return;
          }
        }
      });
      await sleep(1000);
      // body click to set focus
      await f.evaluate(() => document.body.click());
    } catch(e) {}

    // 저장
    await f.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) if (b.textContent.trim() === '저장') { b.click(); return; }
    });
    await sleep(2000);
    console.log(`     ✅ 저장`);
  }

  console.log('\n✅ 완료');
  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));
