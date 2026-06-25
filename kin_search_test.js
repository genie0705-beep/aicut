const { chromium } = require('playwright');
const CDP_PORT = 9224;
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  console.log('=== 지식iN 검색 테스트 ===\n');

  // 지식iN 홈
  await page.goto('https://kin.naver.com/', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(function(e){});
  await sleep(3000);

  // 검색창 찾기
  var inputs = await page.$$('input');
  console.log('input 개수:', inputs.length);

  for (var i = 0; i < inputs.length; i++) {
    var info = await inputs[i].evaluate(function(el) {
      return { placeholder: el.placeholder, type: el.type, id: el.id, class: (el.className || '').substring(0, 30) };
    });
    if (info.placeholder) {
      console.log(i + ': placeholder="' + info.placeholder + '" type=' + info.type);
    }
  }

  // 첫 번째 검색창 찾아서 검색
  for (var j = 0; j < inputs.length; j++) {
    var ph = await inputs[j].evaluate(function(el) { return el.placeholder || ''; });
    if (ph.includes('검색') || ph.includes('지식')) {
      console.log('\n검색창 발견! (' + j + ')');
      await inputs[j].click({ force: true });
      await sleep(500);
      await inputs[j].type('영상편집', { delay: 30 });
      await sleep(1000);
      await page.keyboard.press('Enter');
      await sleep(4000);

      var url = page.url();
      console.log('이동 URL:', url.substring(0, 100));

      var links = await page.evaluate(function() {
        var all = Array.from(document.querySelectorAll('a'));
        return all.filter(function(l) { return l.href && l.href.includes('/qna/detail'); }).slice(0, 5).map(function(l) {
          return { text: (l.innerText || '').trim().substring(0, 40), href: l.href.substring(0, 100) };
        });
      });
      console.log('질문 링크:', JSON.stringify(links, null, 2));

      break;
    }
  }

  await b.close();
})();
