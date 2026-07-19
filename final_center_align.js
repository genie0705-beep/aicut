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
    await sleep(1000);

    const title = await f.evaluate(() => {
      try { return SmartEditor._editors.blogpc001._documentService.getDocumentTitle() || ''; } catch(e) { return ''; }
    });
    if (!title.includes('프로야구') && !title.includes('장맛비')) continue;
    const label = title.includes('프로야구') ? '⚾' : '🌧';
    console.log(`\n${label} execCommand justifyCenter...`);

    // paragraph별로 center align 적용
    const result = await f.evaluate(() => {
      const ed = SmartEditor._editors.blogpc001;
      if (!ed?._documentService) return 'no editor';
      
      const data = ed._documentService.getDocumentData();
      const comps = data?.document?.components || [];
      let count = 0;

      for (const c of comps) {
        if (c['@ctype'] === 'text' && c.value) {
          for (const v of c.value) {
            // v.style.align을 center로 설정
            if (!v.style) v.style = {};
            v.style.align = 'center';
            v.style['@ctype'] = 'paragraphStyle';
            count++;
          }
        }
      }

      // 변경사항 적용 (execCommand로 렌더러 갱신)
      try {
        if (ed._commandManager && typeof ed._commandManager.execCommand === 'function') {
          // 가상의 focus 설정
          ed._commandManager.execCommand('justifyCenter');
        }
      } catch(e) {}

      return `set align on ${count} paragraphs`;
    });

    console.log(`  ${result}`);
    await sleep(1000);

    // 저장
    await f.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) if (b.textContent.trim() === '저장') { b.click(); return; }
    });
    await sleep(2000);
    console.log('  ✅ 저장');
  }

  console.log('\n✅ 완료');
  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));
