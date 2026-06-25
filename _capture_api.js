// 네트워크 캡처: 키워드 추가 API 요청 형식 확인
const { chromium } = require('playwright');
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });
  var pages = ctx.pages();

  var adPage = null;
  for (var i = 0; i < pages.length; i++) {
    if (pages[i].url().indexOf('ads.naver.com') >= 0) { adPage = pages[i]; break; }
  }
  if (!adPage) { await b.close(); return; }

  await adPage.bringToFront();
  await adPage.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566', { waitUntil: 'networkidle', timeout: 15000 }).catch(function(){});
  await sleep(3000);

  // 네트워크 요청 수집
  var postRequests = [];
  adPage.on('response', function(resp) {
    var url = resp.url();
    if (url.indexOf('/ncc/keywords') >= 0 && resp.status() < 300) {
      postRequests.push({ url: url.substring(0, 120), status: resp.status() });
    }
  });

  // 새 키워드 버튼
  await adPage.evaluate(function() {
    var all = document.querySelectorAll('a, button, span, div');
    for (var i = 0; i < all.length; i++) {
      if ((all[i].innerText || '').trim() === '새 키워드' && all[i].offsetParent !== null) {
        all[i].click(); return;
      }
    }
  });
  await sleep(2000);

  // keyboard.type으로 AICUT 입력
  var inputs = document.querySelectorAll('input');
  for (var i = 0; i < inputs.length; i++) {
    // Can't use $$ here, use evaluate instead
  }
  
  // evaluate로 text input 찾기
  await adPage.evaluate(function() {
    var inputs = document.querySelectorAll('input');
    for (var i = 0; i < inputs.length; i++) {
      if (inputs[i].type === 'text' && inputs[i].offsetParent !== null) {
        inputs[i].focus();
        var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(inputs[i], 'AICUT');
        inputs[i].dispatchEvent(new Event('input', { bubbles: true }));
        return;
      }
    }
  });
  await sleep(500);

  // '추가' 버튼 클릭 (실제 저장 시 API 요청 캡처)
  await adPage.evaluate(function() {
    var all = document.querySelectorAll('a');
    for (var i = 0; i < all.length; i++) {
      if ((all[i].innerText || '').trim() === '추가' && all[i].offsetParent !== null) {
        all[i].click(); return;
      }
    }
  });
  await sleep(1500);

  // 저장하고 계속하기
  await adPage.evaluate(function() {
    var all = document.querySelectorAll('a, button, span, div');
    for (var i = 0; i < all.length; i++) {
      if ((all[i].innerText || '').trim() === '저장하고 계속하기' && all[i].offsetParent !== null) {
        all[i].click(); return;
      }
    }
  });
  await sleep(3000);

  console.log('수집된 POST 요청:');
  for (var i = 0; i < postRequests.length; i++) {
    console.log('  ' + JSON.stringify(postRequests[i]));
  }
  if (postRequests.length === 0) {
    console.log('  (API 요청 없음 - 저장이 UI에서만 처리됨)');
  }

  // 직접 페이지의 JavaScript 함수 찾아보기
  console.log('\n키워드 저장 함수 검색...');
  var fnInfo = await adPage.evaluate(function() {
    var r = { reactProps: [], apiEndpoints: [] };
    
    // React 내부 탐색
    var root = document.getElementById('root') || document.getElementById('__next');
    if (root) {
      var reactKey = null;
      for (var k in root) {
        if (k.indexOf('__reactFiber') >= 0 || k.indexOf('__reactInternal') >= 0) {
          reactKey = k;
          break;
        }
      }
      if (reactKey) {
        r.hasReact = true;
      }
    }
    
    // window 전역에서 API 엔드포인트 찾기
    for (var k in window) {
      if (k === 'naver' && window[k] && window[k].AdCenter) {
        r.hasNaverAdCenter = true;
      }
    }
    
    return r;
  });
  console.log(JSON.stringify(fnInfo));

  // 최종 확인
  await adPage.reload({ waitUntil: 'networkidle', timeout: 15000 }).catch(function(){});
  await sleep(3000);
  var finalCheck = await adPage.evaluate(function() {
    return { hasAicut: document.body.innerText.indexOf('AICUT') >= 0 };
  });
  console.log('\nAICUT:', finalCheck.hasAicut ? '✅' : '❌');

  await b.close();
})();
