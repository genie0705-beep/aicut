const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const p = ctx.pages().find(x => x.url().includes('editmon'));
  if (!p) return;

  // 첫 번째 게시물 상세 페이지로 이동
  await p.goto('https://editmon.com/work/employ_detail.html?no=14210', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await p.waitForTimeout(2000);

  const detail = await p.evaluate(() => ({
    url: window.location.href.substring(0, 100),
    text: document.body.innerText.replace(/\n/g, ' ').trim().substring(0, 2000)
  }));
  console.log('=== 공고 상세 ===');
  console.log(detail.text);

  // 이메일 찾기
  const email = await p.evaluate(() => {
    const m = document.body.innerText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    return m ? m[0] : 'NO EMAIL';
  });
  console.log('\n=== 이메일 ===');
  console.log(email);
})();
