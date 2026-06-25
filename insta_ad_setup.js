const { chromium } = require('playwright');
const CDP_PORT = 9224;
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  var page = null;
  for (var i = 0; i < ctx.pages().length; i++) {
    if (ctx.pages()[i].url().includes('instagram.com') && !ctx.pages()[i].url().includes('accounts')) {
      page = ctx.pages()[i]; break;
    }
  }
  if (!page) { page = await ctx.newPage(); }
  await page.bringToFront();

  console.log('=== 릴스 광고 설정 ===\n');
  
  // 릴스 페이지 이동
  console.log('1. 릴스 페이지 이동...');
  await page.goto('https://www.instagram.com/reel/DZ6a5byNHfd/', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(function(e){});
  await sleep(4000);

  // 홍보/부스트 버튼 찾기
  console.log('2. 홍보/부스트 버튼 검색...');
  var btns = await page.evaluate(function() {
    var allEls = Array.from(document.querySelectorAll('button, a, span, div, [role="button"]'));
    var visible = allEls.filter(function(el) { return el.offsetParent !== null; });
    var texts = [];
    for (var i = 0; i < visible.length; i++) {
      var t = (visible[i].innerText || '').trim();
      if (t && t.length < 30) texts.push(t);
    }
    // 중복 제거
    return Array.from(new Set(texts)).slice(0, 20);
  });
  console.log('   visible buttons:', JSON.stringify(btns));
  
  // '게시물 홍보하기' 찾기
  var promoFound = await page.evaluate(function() {
    var els = document.querySelectorAll('button, a, div[role="button"], span, div');
    for (var i = 0; i < els.length; i++) {
      var t = (els[i].innerText || '').trim();
      if (t === '게시물 홍보하기' || t.includes('홍보')) {
        if (els[i].offsetParent !== null) {
          els[i].click();
          return 'clicked: ' + t.substring(0, 20);
        }
      }
    }
    return 'not found';
  });
  console.log('   홍보 버튼:', promoFound);
  await sleep(3000);

  // 홍보 페이지로 이동되었는지 확인
  var url = page.url();
  console.log('3. 현재 URL:', url.substring(0, 100));

  // Meta Ads 부스트 설정 화면 분석
  var boostData = await page.evaluate(function() {
    var text = document.body.innerText || '';
    return text.substring(0, 2000);
  });
  console.log('   부스트 페이지 내용:', boostData.substring(0, 500));

  // Meta Ads Manager 접속
  console.log('\n4. Meta Ads Manager 접속...');
  await page.goto('https://www.facebook.com/adsmanager', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(function(e){});
  await sleep(5000);
  var fbUrl = page.url();
  console.log('   URL:', fbUrl.substring(0, 80));

  var fbData = await page.evaluate(function() {
    var text = document.body.innerText || '';
    return text.substring(0, 500);
  });
  console.log('   Ads Manager:', fbData.substring(0, 200));

  await b.close();
})();
