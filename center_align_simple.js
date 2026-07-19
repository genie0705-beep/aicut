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
    console.log(`\n${label} 가운데 정렬...`);

    // 에디터 본문 영역에 직접 focus + click
    await f.evaluate(() => {
      const docElements = document.querySelectorAll('.__se-sentry, [class*="se-doc"], [class*="suneditor"]');
      for (const el of docElements) {
        if (el.offsetParent !== null) {
          el.click();
          return;
        }
      }
      // fallback: body
      document.body.click();
    });
    await sleep(800);

    // 정렬 버튼 → 가운데 정렬 (3회 반복 = 3개 paragraph 적용)
    for (let r = 0; r < 10; r++) {
      await p.keyboard.press('ArrowDown');
      await sleep(100);
      await f.evaluate(() => {
        const btns = document.querySelectorAll('button');
        for (const b of btns) if (b.textContent.includes('정렬') && b.offsetParent) { b.click(); return; }
      });
      await sleep(800);
      await f.evaluate(() => {
        const items = document.querySelectorAll('button, li, div[role="menuitem"]');
        for (const el of items) if (el.textContent.trim() === '가운데 정렬' && el.offsetParent) { el.click(); return; }
      });
      await sleep(300);
    }

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
