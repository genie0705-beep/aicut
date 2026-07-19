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

    // 1. 에디터 본문에 포커스
    await f.evaluate(() => {
      const editAreas = document.querySelectorAll('[class*="editor"], [class*="se-doc"]');
      for (const el of editAreas) {
        if (el.offsetParent !== null) { el.focus(); el.click(); return; }
      }
      document.body.focus();
    });
    await sleep(500);

    // 2. 모두 선택
    await p.keyboard.press('Control+a');
    await sleep(1000);

    // 3. 정렬 버튼 찾기 (툴바)
    const alignBtn = await f.evaluate(() => {
      const items = document.querySelectorAll('button');
      for (const el of items) {
        const t = el.textContent.trim();
        if (t.includes('정렬') && (el.className.includes('toolbar') || el.className.includes('se-'))) {
          if (el.offsetParent !== null) { el.click(); return 'clicked: ' + t.substring(0, 20); }
        }
      }
      // 모든 visible button 시도
      for (const el of items) {
        if (el.textContent.trim().includes('정렬') && el.offsetParent !== null) {
          el.click(); return 'clicked any: ' + el.className.substring(0, 30);
        }
      }
      return 'no align button';
    });
    console.log(`     정렬버튼: ${alignBtn}`);
    await sleep(2000);

    // 4. 가운데 정렬 선택 (팝업 메뉴에서)
    const centerBtn = await f.evaluate(() => {
      const items = document.querySelectorAll('button, li, div[role="menuitem"], a');
      for (const el of items) {
        const t = el.textContent.trim();
        if ((t === '가운데 정렬' || t === '가운데') && el.offsetParent !== null) {
          el.click(); return 'clicked center';
        }
      }
      return 'no center button';
    });
    console.log(`     센터버튼: ${centerBtn}`);
    await sleep(1000);

    // 저장
    await f.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) if (b.textContent.trim() === '저장') { b.click(); return; }
    });
    await sleep(2000);
    console.log('   ✅ 저장');
  }

  console.log('\n✅ 완료');
  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));
