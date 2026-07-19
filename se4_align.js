const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();

  // 에디터 탭 찾기
  let page = null;
  for (const p of pages) {
    if (p.url().includes('PostWriteForm') || p.url().includes('Redirect=Write')) { page = p; break; }
  }
  if (!page) { console.log('❌ 에디터 탭 없음'); return; }

  let ef = null;
  for (const f of page.frames()) {
    try { if (await f.evaluate(() => typeof SmartEditor !== 'undefined')) { ef = f; break; } } catch(e) {}
  }
  if (!ef) { console.log('❌ SmartEditor 없음'); return; }

  // 현재 상태 확인
  const status = await ef.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const len = ed.getContentText ? ed.getContentText().length : -1;
    const title = ed.getDocumentTitle ? ed.getDocumentTitle() : '';
    const canvas = document.querySelector('.se-canvas');
    const canvasText = canvas ? canvas.innerText.substring(0, 100) : '';
    const paras = document.querySelectorAll('.se-text-paragraph').length;
    const images = document.querySelectorAll('img').length;
    return { textLen: len, title, canvasText, paras, images };
  });

  console.log(`본문: ${status.textLen}자`);
  console.log(`문단: ${status.paras}개`);
  console.log(`이미지: ${status.images}개`);
  console.log(`캔버스: ${status.canvasText}`);

  if (status.paras === 0) {
    console.log('⚠️ 내용이 없습니다');
    return;
  }

  // 센터정렬 적용
  console.log('\n센터정렬 적용 중...');
  const result = await ef.evaluate(() => {
    const paras = document.querySelectorAll('.se-text-paragraph');
    let count = 0;
    
    paras.forEach(p => {
      p.classList.add('se-text-paragraph-align-center');
      p.style.textAlign = 'center';
      count++;
    });

    // SE4에 변경 알림
    const canvas = document.querySelector('.se-canvas');
    if (canvas) {
      canvas.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
    }

    return { aligned: count };
  });

  console.log(`✅ ${result.aligned}개 문단 센터정렬 완료`);

  // 저장
  console.log('저장 중...');
  await ef.evaluate(() => {
    for (const btn of document.querySelectorAll('button')) {
      if (btn.innerText.trim() === '저장') { btn.click(); break; }
    }
  });

  console.log('✅ 완료! 브라우저 확인해주세요.');
})();
