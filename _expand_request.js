// 요청 메뉴 펼치고 웹페이지 수집 실행
const { chromium } = require('playwright');
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });
  var pages = ctx.pages();

  var saPage = null;
  for (var i = 0; i < pages.length; i++) {
    if (pages[i].url().indexOf('searchadvisor') >= 0) { saPage = pages[i]; break; }
  }
  if (!saPage) { await b.close(); return; }

  await saPage.bringToFront();
  var encSite = encodeURIComponent('https://aicut.co.kr');
  await saPage.goto('https://searchadvisor.naver.com/console/site/summary?site=' + encSite, { waitUntil: 'networkidle', timeout: 15000 }).catch(function(){});
  await sleep(2000);

  // expand_more 아이콘 모두 찾아서 요청 메뉴 영역 것 클릭
  var clickResult = await saPage.evaluate(function() {
    var icons = document.querySelectorAll('i, span');
    for (var i = 0; i < icons.length; i++) {
      var t = (icons[i].innerText || '').trim();
      if (t === 'expand_more' && icons[i].offsetParent !== null) {
        // 부모 텍스트 확인
        var parent = icons[i].parentElement;
        var parentText = parent ? (parent.innerText || '') : '';
        if (parentText.indexOf('요청') >= 0) {
          icons[i].click();
          return { clicked: true, method: '요청 메뉴 expand' };
        }
      }
    }
    return { clicked: false };
  });
  console.log('expand_more:', JSON.stringify(clickResult));
  await sleep(2000);

  // 모든 visible 텍스트 수집 (하위메뉴 확인)
  var allTexts = await saPage.evaluate(function() {
    var r = [];
    document.querySelectorAll('a, div, span, li').forEach(function(el) {
      var t = (el.innerText || '').trim();
      if (t && el.offsetParent !== null && t.length < 25) {
        if (r.indexOf(t) < 0) r.push(t);
      }
    });
    return r;
  });
  console.log('현재 보이는 텍스트:');
  allTexts.forEach(function(t) { console.log('  - ' + t); });

  // 웹페이지 수집 찾기
  var found = false;
  for (var i = 0; i < allTexts.length; i++) {
    if (allTexts[i].indexOf('웹페이지') >= 0) {
      console.log('\n웹페이지 수집 발견! 클릭합니다.');
      await saPage.evaluate(function(text) {
        var all = document.querySelectorAll('a, div, span, li');
        for (var j = 0; j < all.length; j++) {
          var t = (all[j].innerText || '').trim();
          if (t.indexOf(text) >= 0 && all[j].offsetParent !== null) {
            all[j].click(); return;
          }
        }
      }, allTexts[i]);
      found = true;
      break;
    }
  }

  if (found) {
    await sleep(3000);
    console.log('URL:', saPage.url().substring(0, 120));
    var pageText = await saPage.evaluate(function() {
      return document.body.innerText.substring(0, 800);
    });
    console.log('\n=== 페이지 내용 ===');
    console.log(pageText);

    // URL 입력창 + 수집 요청 버튼 찾기
    var inputs = await saPage.evaluate(function() {
      var r = [];
      document.querySelectorAll('input').forEach(function(inp) {
        if (inp.offsetParent !== null) {
          r.push({ type: inp.type, placeholder: inp.placeholder, id: inp.id });
        }
      });
      return r;
    });
    console.log('\n입력창:', JSON.stringify(inputs));

    // 버튼 찾기
    var btns = await saPage.evaluate(function() {
      var r = [];
      document.querySelectorAll('button, a, div[role]').forEach(function(el) {
        var t = (el.innerText || '').trim();
        if (t && el.offsetParent !== null && t.length < 15) {
          r.push(t);
        }
      });
      return r;
    });
    console.log('버튼:', JSON.stringify(btns));
  }

  await b.close();
})();
