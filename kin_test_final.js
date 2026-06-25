const { chromium } = require('playwright');
const CDP_PORT = 9224;
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  console.log('=== 지식iN 검색 테스트 ===\n');

  await page.goto('https://kin.naver.com/', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(function(e){});
  await sleep(3000);

  // nx_query input 찾기
  var input = await page.$('#nx_query');
  if (input) {
    console.log('검색창 찾음 ✅');
    await input.click({ force: true });
    await sleep(500);
    await input.type('영상편집 외주', { delay: 30 });
    await sleep(1000);
    await page.keyboard.press('Enter');
    await sleep(5000);

    console.log('이동 URL:', page.url().substring(0, 100));

    var links = await page.evaluate(function() {
      var all = Array.from(document.querySelectorAll('a'));
      return all.filter(function(l) { return l.href && l.href.includes('/qna/detail'); }).slice(0, 5).map(function(l) {
        return { text: (l.innerText || '').trim().substring(0, 40), href: l.href.substring(0, 100) };
      });
    });
    console.log('질문 링크:', JSON.stringify(links, null, 2));
  } else {
    console.log('검색창 못 찾음 ❌');
  }

  await b.close();
})();
