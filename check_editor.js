// 현재 에디터 상태 정밀 확인
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];

  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('postwrite')) {
      page = p;
      console.log('postwrite 탭 발견');
      break;
    }
  }

  if (!page) {
    console.log('postwrite 탭 없음');
    console.log('현재 탭 목록:');
    for (const p of ctx.pages()) {
      console.log(' ', p.url().substring(0, 80));
    }
    try { await b.close(); } catch(e) {}
    process.exit(1);
  }

  // 1) 제목 확인
  const title = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    for (const inp of inputs) {
      if (inp.value && inp.value.length > 3) {
        return inp.value.substring(0, 50);
      }
    }
    return '제목 없음';
  }).catch(() => '오류');
  console.log('제목:', title);

  // 2) contenteditable 내용 확인
  const content = await page.evaluate(() => {
    const eds = document.querySelectorAll('[contenteditable]');
    let result = '';
    for (const ed of eds) {
      const txt = ed.innerText || '';
      if (txt.length > result.length) result = txt;
    }
    return result.length > 0
      ? result.substring(0, 200) + '\n... (' + result.length + '자)'
      : '내용 없음';
  }).catch(() => '오류');
  console.log('본문:\n', content);

  // 3) 페이지 URL 재확인
  console.log('\n탭 URL:', page.url());

  try { await b.close(); } catch(e) {}
})();
