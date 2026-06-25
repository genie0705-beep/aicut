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

  // 검색창 정보 한 번에 얻기
  var inputsInfo = await page.evaluate(function() {
    var inputs = Array.from(document.querySelectorAll('input'));
    return inputs.map(function(el) {
      return { placeholder: el.placeholder || '', type: el.type, id: el.id || '' };
    });
  });
  console.log('input 개수:', inputsInfo.length);

  var found = false;
  for (var i = 0; i < inputsInfo.length; i++) {
    if (inputsInfo[i].placeholder.includes('검색')) {
      console.log('검색창 발견! index=' + i + ' placeholder="' + inputsInfo[i].placeholder + '"');
      
      var searchInput = (await page.$$('input'))[i];
      await searchInput.click({ force: true });
      await sleep(500);
      await searchInput.type('영상편집', { delay: 30 });
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
      
      found = true;
      break;
    }
  }

  if (!found) {
    console.log('검색창 못 찾음. placeholder list:');
    inputsInfo.forEach(function(info, i) {
      if (info.placeholder) console.log(i + ': "' + info.placeholder + '"');
    });
  }

  await b.close();
})();
