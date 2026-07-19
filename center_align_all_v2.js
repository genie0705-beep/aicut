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

    // 각 paragraph에 대해 center align 적용
    const result = await f.evaluate(() => {
      const ed = SmartEditor._editors.blogpc001;
      if (!ed) return 'no editor';
      
      // 1. 모든 text component의 모든 paragraph에 style 추가
      const data = ed._documentService.getDocumentData();
      if (!data?.document?.components) return 'no comps';
      
      let count = 0;
      for (const c of data.document.components) {
        if (c['@ctype'] === 'text' && c.value) {
          for (const v of c.value) {
            if (!v.style) v.style = {};
            v.style.align = 'center';
            v.style['@ctype'] = 'paragraphStyle';
            count++;
          }
        }
      }

      // 2. API로 다시 설정 (렌더링 트리거)
      try { ed._documentService.setDocumentData(data); } catch(e) { return 'setDocumentData failed'; }
      
      return `center align applied to ${count} paragraphs`;
    });

    console.log(`  ${result}`);

    // 실패시 다른 방법 시도
    if (result && result.includes('failed')) {
      console.log('  setDocumentData 실패, 툴바 방식 재시도...');
      
      // paragraph 하나하나 선택해서 정렬
      for (let i = 0; i < 5; i++) {
        await p.keyboard.press('ArrowDown');
        await sleep(200);
        await f.evaluate(() => {
          const btns = document.querySelectorAll('button');
          for (const b of btns) if (b.textContent.includes('정렬') && b.className.includes('se-')) { b.click(); return; }
        });
        await sleep(500);
        await f.evaluate(() => {
          const items = document.querySelectorAll('button, li');
          for (const el of items) if (el.textContent.trim() === '가운데 정렬' && el.offsetParent) { el.click(); return; }
        });
        await sleep(500);
      }
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
