const { chromium } = require('playwright');
const CDP_PORT = 9224;
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  console.log('=== 네이버 광고 고객센터 메뉴 접근 ===\n');
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  // 대시보드로 이동
  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/dashboard', { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(2000);

  // 고객센터 링크 찾기
  var csResult = await page.evaluate(function() {
    var links = Array.from(document.querySelectorAll('a, span, div'));
    var csLinks = links.filter(function(l) {
      var t = l.innerText || '';
      return t.trim() === '고객센터';
    }).map(function(l) {
      return {
        text: (l.innerText || '').trim().substring(0, 20),
        href: (l.getAttribute('href') || ''),
        tag: l.tagName,
        class: (l.className || '').substring(0, 50)
      };
    });
    return csLinks;
  });
  console.log('고객센터 요소:', JSON.stringify(csResult, null, 2));

  // 고객센터 주변 요소 클릭 가능한 링크 찾기
  await page.evaluate(function() {
    var spans = document.querySelectorAll('span');
    for (var i = 0; i < spans.length; i++) {
      if ((spans[i].innerText || '').trim() === '고객센터') {
        var parent = spans[i].closest('a');
        if (parent && parent.href) {
          window.open(parent.href, '_blank');
          return;
        }
      }
    }
  });
  await sleep(3000);

  // 새로 열린 탭 확인
  var newPages = ctx.pages();
  var lastPage = newPages[newPages.length - 1];
  if (lastPage && lastPage !== page) {
    var url = lastPage.url();
    console.log('새 탭 URL:', url);
    var text = await lastPage.evaluate(function() {
      return (document.body.innerText || '').substring(0, 500);
    });
    console.log('내용:', text.substring(0, 200));
  }

  // 네이버 비즈니스 고객센터 직접 접속
  console.log('\n네이버 비즈니스 고객센터 시도...');
  await page.goto('https://business.naver.com/', { waitUntil: 'networkidle', timeout: 15000 }).catch(function(e) { console.log('오류:', e.message.substring(0, 50)); });
  await sleep(2000);
  var bizText = await page.evaluate(function() {
    return (document.body.innerText || '').substring(0, 500);
  });
  console.log('내용:', bizText.substring(0, 200));

  await b.close();
})();
