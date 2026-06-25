// 광고그룹 ID 찾기 + 키워드 추가 (API 직접 호출)
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
  await adPage.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/campaigns/cmp-a001-01-000000010565267', { waitUntil: 'networkidle', timeout: 15000 }).catch(function(){});
  await sleep(4000);

  // 1. 페이지에서 광고그룹 관련 데이터 수집
  var info = await adPage.evaluate(function() {
    var r = {};
    
    // '퀵스타트' 텍스트 포함된 요소 찾기
    var all = document.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) {
      var t = (all[i].innerText || '').trim();
      if (t.indexOf('퀵스타트_파워링크') >= 0 && all[i].offsetParent !== null) {
        r.found = { tag: all[i].tagName, text: t };
        r.attrs = {};
        for (var j = 0; j < all[i].attributes.length; j++) {
          var a = all[i].attributes[j];
          r.attrs[a.name] = (a.value || '').substring(0, 80);
        }
        // 부모 요소들도 확인
        var p = all[i].parentElement;
        r.parentTag = p.tagName;
        r.parentAttrs = {};
        for (var j = 0; j < p.attributes.length; j++) {
          var a = p.attributes[j];
          r.parentAttrs[a.name] = (a.value || '').substring(0, 80);
        }
        break;
      }
    }
    
    // 모든 a 태그에서 광고그룹 관련 href 찾기
    r.links = [];
    document.querySelectorAll('a').forEach(function(a) {
      var h = a.href || '';
      if (h.indexOf('ad-group') >= 0 || h.indexOf('adgroup') >= 0 || h.indexOf('ncc') >= 0) {
        r.links.push({ href: h.substring(0, 150), text: (a.innerText || '').substring(0, 30) });
      }
    });
    
    // window.ncc 또는 전역 객체 확인
    if (window.__NEXT_DATA__) r.nextData = JSON.stringify(window.__NEXT_DATA__).substring(0, 500);
    
    return r;
  });
  
  console.log('수집 정보:', JSON.stringify(info, null, 2));

  // 2. 다른 API 경로 시도
  console.log('\n--- 광고그룹 API 호출 (다른 경로) ---');
  var result2 = await adPage.evaluate(async function() {
    var results = [];
    
    var urls = [
      'https://ads.naver.com/apis/sa/api/ncc/campaigns/cmp-a001-01-000000010565267/adgroups',
      'https://ads.naver.com/apis/sa/api/ncc/adgroups',
      'https://ads.naver.com/apis/sa/api/ncc/managed-customers/1800255/adgroups',
    ];
    
    for (var i = 0; i < urls.length; i++) {
      try {
        var resp = await fetch(urls[i], { credentials: 'include' });
        var text = await resp.text();
        results.push({ url: urls[i].substring(0, 80), status: resp.status, body: text.substring(0, 300) });
      } catch(e) {
        results.push({ url: urls[i].substring(0, 80), error: e.message });
      }
    }
    return results;
  });
  
  console.log(JSON.stringify(result2, null, 2));

  // 3. 광고그룹 상세 페이지에서 네트워크 요청 재수집
  console.log('\n--- 페이지 리로드 후 네트워크 수집 ---');
  
  var apiCalls = [];
  adPage.on('response', function(resp) {
    var url = resp.url();
    if (url.indexOf('/ncc/') >= 0 || url.indexOf('/sa/') >= 0) {
      apiCalls.push(url.substring(0, 120));
    }
  });
  
  await adPage.reload({ waitUntil: 'networkidle', timeout: 15000 }).catch(function(){});
  await sleep(5000);
  
  console.log('수집된 NCC API 호출:');
  for (var i = 0; i < apiCalls.length; i++) {
    console.log('  [' + i + '] ' + apiCalls[i]);
  }
  
  await b.close();
})();
