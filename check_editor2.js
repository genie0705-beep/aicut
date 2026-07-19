const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  console.log('열린 탭:', pages.length);
  for (const p of pages) {
    const url = p.url();
    console.log('  -', url.substring(0, 120));
  }
  // Write tab 찾기
  const write = pages.find(p => p.url().includes('Redirect=Write'));
  if (write) {
    console.log('\n✅ 블로그 작성 탭 발견!');
    const title = await write.title();
    console.log('타이틀:', title.substring(0, 80));
    // 제목 영역 확인
    const hasTitle = await write.evaluate(() => {
      try {
        const ed = SmartEditor._editors['blogpc001'];
        return ed ? 'SmartEditor 있음' : 'SmartEditor 없음';
      } catch(e) { return '접근 불가: ' + e.message; }
    });
    console.log('에디터:', hasTitle);
    // 현재 제목 확인
    const curTitle = await write.evaluate(() => {
      try {
        return SmartEditor._editors['blogpc001'].getDocumentTitle();
      } catch(e) { return '오류: ' + e.message; }
    });
    console.log('현재 제목:', curTitle);
    // canvas 내용 확인
    const canvasText = await write.evaluate(() => {
      const c = document.querySelector('.se-canvas');
      return c ? c.innerText.substring(0, 200) : 'canvas 없음';
    });
    console.log('canvas 미리보기:', canvasText.substring(0, 100));
    console.log('탭 URL:', write.url());
  } else {
    console.log('\n❌ 블로그 작성 탭 없음');
  }
  // disconnect 대신 browser close 하지 않고 just exit
  console.log('\n완료');
  process.exit(0);
})();
