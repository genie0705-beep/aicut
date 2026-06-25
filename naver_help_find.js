const { chromium } = require('playwright');
const CDP_PORT = 9224;
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  console.log('=== 네이버 광고 1:1 문의 페이지 찾기 ===\n');
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  // 네이버 광고 고객센터
  var urls = [
    'https://adcenterhelp.naver.com/',
    'https://ads.naver.com/help',
    'https://ads.naver.com/cs',
    'https://customer.naver.com/',
    'https://adcenterhelp.naver.com/inquiry'
  ];

  for (var i = 0; i < urls.length; i++) {
    try {
      await page.goto(urls[i], { waitUntil: 'networkidle', timeout: 15000 });
      await sleep(2000);
      var text = await page.evaluate(function() {
        return (document.body.innerText || '').substring(0, 500);
      });
      console.log('[' + i + '] ' + urls[i]);
      console.log('   ' + text.substring(0, 200).replace(/\n/g, ' '));
      
      // 문의 링크 찾기
      var links = await page.evaluate(function() {
        return Array.from(document.querySelectorAll('a')).filter(function(l) {
          var t = l.innerText || '';
          return t.includes('문의') || t.includes('문의하기') || t.includes('1:1') || t.includes('상담');
        }).slice(0, 3).map(function(l) {
          return l.innerText.trim().substring(0, 30) + ' -> ' + (l.href || '').substring(0, 80);
        });
      });
      if (links.length > 0) {
        console.log('   문의 링크:', links.join(', '));
      }
    } catch(e) {
      console.log('[' + i + '] ' + urls[i] + ' - 오류: ' + e.message.substring(0, 50));
    }
    console.log('');
  }

  await b.close();
})();
