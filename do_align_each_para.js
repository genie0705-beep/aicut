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

    // 각 paragraph ID 수집
    const paraIds = await f.evaluate(() => {
      const ed = SmartEditor._editors.blogpc001;
      const data = ed._documentService.getDocumentData();
      const ids = [];
      for (const c of data.document.components) {
        if (c['@ctype'] === 'text' && c.value) {
          for (const v of c.value) {
            if (v.id) ids.push(v.id);
          }
        }
      }
      return ids;
    });

    console.log(`\n${label} ${paraIds.length}개 문단 정렬 중...`);
    
    // 각 paragraph에 execCommand('justifyCenter')
    let success = 0;
    for (let i = 0; i < paraIds.length; i++) {
      const pid = paraIds[i];
      try {
        const r = await f.evaluate((id) => {
          const ed = SmartEditor._editors.blogpc001;
          // set cursor to this paragraph
          const vEditable = ed._virtualEditable;
          if (vEditable && typeof vEditable._execute === 'function') {
            vEditable._execute('moveCursorTo', { componentId: id });
          }
          // apply center align
          ed._commandManager.execCommand('justifyCenter');
          return 'ok';
        }, pid);
        success++;
      } catch(e) {
        // silent fail
      }
      
      if ((i + 1) % 20 === 0) {
        console.log(`  ${i+1}/${paraIds.length} 완료`);
      }
    }

    console.log(`  ${success}/${paraIds.length} 적용됨`);

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
