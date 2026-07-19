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

    // 1. 모두 선택 (Ctrl+A)
    await f.evaluate(() => document.body.focus());
    await sleep(500);
    await p.keyboard.press('Control+a');
    await sleep(1000);

    // 2. "정렬" 버튼 찾아서 클릭
    await f.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        if (b.textContent.trim() === '정렬' || b.textContent.includes('정렬')) {
          b.click();
          return;
        }
      }
    });
    await sleep(1500);

    // 3. "가운데 정렬" 옵션 클릭
    await f.evaluate(() => {
      const btns = document.querySelectorAll('button, li, div[role="button"]');
      for (const b of btns) {
        const t = b.textContent.trim();
        if (t === '가운데 정렬' || t.includes('가운데') || t === 'center') {
          b.click();
          return;
        }
      }
    });
    await sleep(1000);

    // 저장
    await f.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) if (b.textContent.trim() === '저장') { b.click(); return; }
    });
    await sleep(2000);

    console.log(`${label} ✅ 가운데 정렬 + 저장`);
  }

  console.log('\n✅ 센터정렬 완료');
  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));
