const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  console.log('열린 탭:', pages.length);
  for (const p of pages) {
    const url = p.url();
    console.log('  -', url.substring(0, 120));
  }
  // SE4 탭 찾기
  const se4 = pages.find(p => p.url().includes('smarteditor'));
  if (se4) {
    console.log('\n✅ SE4 에디터 탭 발견!');
    const title = await se4.title();
    console.log('타이틀:', title);
    const html = await se4.content();
    console.log('HTML 길이:', html.length);
  } else {
    console.log('\n❌ SE4 에디터 탭 없음');
  }
  await b.disconnect();
  console.log('\n완료');
})();
