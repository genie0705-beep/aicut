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

    // 제목으로 내용 식별
    const title = await f.evaluate(() => {
      try { return SmartEditor._editors.blogpc001._documentService.getDocumentTitle() || ''; } catch(e) { return ''; }
    });
    if (!title.includes('프로야구') && !title.includes('장맛비')) continue;

    const label = title.includes('프로야구') ? '⚾' : '🌧';
    
    // 가운데 정렬 버튼 찾아서 클릭
    // SmartEditor ONE에서 paragraph 선택 후 align center
    await f.evaluate(() => {
      // select all content in editor
      const ed = SmartEditor._editors.blogpc001;
      if (!ed) return;
      
      // align all paragraphs to center
      const comps = ed._documentService.getDocumentData()?.document?.components || [];
      for (let i = 1; i < comps.length; i++) { // skip title (index 0)
        const c = comps[i];
        if (c['@ctype'] === 'text' && c.value) {
          for (const v of c.value) {
            if (!v.style) v.style = {};
            v.style.align = 'center';
            v.style['@ctype'] = 'paragraphStyle';
          }
        }
      }
      
      ed._documentService.setDocumentData(ed._documentService.getDocumentData());
    });

    console.log(`${label} ✅ 가운데 정렬 적용`);
    await sleep(2000);

    // 저장
    await f.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) if (b.textContent.trim() === '저장') { b.click(); return; }
    });
    await sleep(2000);
    console.log(`     ✅ 저장`);
  }

  console.log('\n✅ 가운데 정렬 완료');
  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));
