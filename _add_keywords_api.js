// 키워드 추가 - 모달 분석 + API 직접 호출
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

  // 네트워크 모니터링 시작
  var apiCalls = [];
  adPage.on('response', function(resp) {
    var url = resp.url();
    if (url.indexOf('/api/ncc/keywords') >= 0 || url.indexOf('/api/ncc/adkeywords') >= 0) {
      apiCalls.push(url.substring(0, 120));
    }
  });

  // API로 직접 키워드 추가 (저장 버튼이 안 보이므로)
  console.log('API 직접 호출로 키워드 추가...');
  var apiResult = await adPage.evaluate(async function() {
    var results = [];
    
    // 시도 1: adgroupId 기반
    try {
      var resp = await fetch('https://ads.naver.com/apis/sa/api/ncc/adgroups/grp-a001-01-000000065663566/keywords', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywordList: [
            { keyword: '에이컷', bidAmt: 500 },
            { keyword: 'AICUT', bidAmt: 500 }
          ]
        })
      });
      var data = await resp.text();
      results.push({ method: 'adgroup/keywords', status: resp.status, body: data.substring(0, 300) });
    } catch(e) {
      results.push({ method: 'adgroup/keywords', error: e.message });
    }
    
    // 시도 2: /api/ncc/keywords
    try {
      var resp = await fetch('https://ads.naver.com/apis/sa/api/ncc/keywords', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adgroupId: 'grp-a001-01-000000065663566',
          customerId: 1800255,
          keywordList: [
            { keyword: '에이컷', bidAmt: 500 },
            { keyword: 'AICUT', bidAmt: 500 }
          ]
        })
      });
      var data = await resp.text();
      results.push({ method: 'ncc/keywords', status: resp.status, body: data.substring(0, 300) });
    } catch(e) {
      results.push({ method: 'ncc/keywords', error: e.message });
    }
    
    return results;
  });
  
  console.log('API 결과:', JSON.stringify(apiResult, null, 2));
  
  // 키워드 목록 다시 확인
  console.log('\n--- 키워드 목록 재확인 ---');
  var keywordCount = await adPage.evaluate(function() {
    var all = document.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) {
      var t = (all[i].innerText || '').trim();
      if (t === '에이컷' && all[i].offsetParent !== null) {
        return '에이컷 발견!';
      }
      if (t === 'AICUT' && all[i].offsetParent !== null) {
        return 'AICUT 발견!';
      }
    }
    return '미발견';
  });
  console.log('키워드 확인:', keywordCount);
  
  await b.close();
})();
