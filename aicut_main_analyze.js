const { chromium } = require('playwright');
const CDP_PORT = 9224;
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  console.log('=== 에이컷 메인 페이지 분석 ===\n');

  await page.goto('https://aicut.co.kr/', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(function(e){});
  await sleep(5000);

  var result = await page.evaluate(function() {
    var text = document.body.innerText || '';
    var firstScreen = text.substring(0, 1500);

    var headings = [];
    var hs = document.querySelectorAll('h1, h2, h3, h4');
    hs.forEach(function(h) {
      headings.push(h.tagName + ': ' + (h.innerText || '').trim().substring(0, 60));
    });

    var buttons = [];
    var allEls = document.querySelectorAll('button, a');
    allEls.forEach(function(el) {
      var t = (el.innerText || '').trim();
      if (t && t.length < 40) buttons.push(t);
    });

    var links = [];
    var allLinks = document.querySelectorAll('a[href]');
    allLinks.forEach(function(a) {
      var h = a.getAttribute('href') || '';
      if (h && !h.startsWith('#') && !h.startsWith('javascript') && !h.startsWith('tel')) {
        links.push(h.substring(0, 60));
      }
    });

    return {
      firstScreen: firstScreen,
      headings: headings,
      buttons: Array.from(new Set(buttons)).slice(0, 15),
      links: Array.from(new Set(links)).slice(0, 10)
    };
  });

  console.log('=== 첫 화면 (Hero) ===');
  console.log(result.firstScreen);

  console.log('\n=== 헤딩 구조 ===');
  result.headings.forEach(function(h) { console.log('  ' + h); });

  console.log('\n=== 버튼 텍스트 ===');
  result.buttons.forEach(function(b) { console.log('  ' + b); });

  console.log('\n=== 주요 링크 ===');
  result.links.forEach(function(l) { console.log('  ' + l); });

  await page.screenshot({ path: 'C:\\Users\\paul\\.openclaw\\workspace\\_aicut_main.png', fullPage: true });
  console.log('\n✅ 스크린샷 저장');

  await b.close();
})();
