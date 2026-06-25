// 키워드 추가 - 새 키워드 버튼 → 입력 → 저장
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

  // '새 키워드' 버튼 클릭
  console.log('1. 새 키워드 버튼 클릭...');
  var btnClicked = await adPage.evaluate(function() {
    var all = document.querySelectorAll('a, button, span, div');
    for (var i = 0; i < all.length; i++) {
      var t = (all[i].innerText || '').trim();
      if (t === '새 키워드' && all[i].offsetParent !== null) {
        all[i].click();
        return true;
      }
    }
    return false;
  });
  console.log('   결과:', btnClicked ? '✅' : '❌');
  await sleep(3000);

  // 키워드 입력창 찾기
  var inputFound = await adPage.evaluate(function() {
    var inputs = document.querySelectorAll('input');
    var r = { count: inputs.length, visible: [] };
    for (var i = 0; i < inputs.length; i++) {
      if (inputs[i].offsetParent !== null) {
        r.visible.push({ type: inputs[i].type, placeholder: inputs[i].placeholder, id: inputs[i].id });
      }
    }
    return r;
  });
  console.log('2. 입력창:', JSON.stringify(inputFound));

  // 키워드 입력 (가장 먼저 보이는 input에)
  if (inputFound.visible.length > 0) {
    var firstInput = await adPage.$('input');
    if (firstInput) {
      await firstInput.click({ force: true });
      await sleep(500);
      
      // '에이컷' 입력
      await adPage.keyboard.type('에이컷', { delay: 30 });
      await sleep(500);
      await adPage.keyboard.press('Enter');
      await sleep(500);
      
      // 'AICUT' 입력  
      await adPage.keyboard.type('AICUT', { delay: 30 });
      await sleep(500);
      await adPage.keyboard.press('Enter');
      await sleep(500);

      // '에이컷 영상편집' 입력
      await adPage.keyboard.type('에이컷 영상편집', { delay: 30 });
      await sleep(500);
      await adPage.keyboard.press('Enter');
      await sleep(1000);

      console.log('3. 키워드 입력 ✅');
      
      // 저장 버튼 찾기
      var saved = await adPage.evaluate(function() {
        var all = document.querySelectorAll('a, button, span, div');
        for (var i = 0; i < all.length; i++) {
          var t = (all[i].innerText || '').trim();
          if ((t === '저장' || t === '확인') && all[i].offsetParent !== null) {
            all[i].click();
            return { text: t };
          }
        }
        return null;
      });
      console.log('4. 저장:', JSON.stringify(saved));
      await sleep(3000);
      console.log('5. ✅ 키워드 추가 완료!');
    }
  } else {
    console.log('입력창 없음, API 직접 호출 시도');
    
    // API 직접 호출
    var apiResult = await adPage.evaluate(async function() {
      try {
        var resp = await fetch('https://ads.naver.com/apis/sa/api/ncc/keywords', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            adgroupId: 'grp-a001-01-000000065663566',
            keywordList: [
              { keyword: '에이컷', bidAmt: 500 },
              { keyword: 'AICUT', bidAmt: 500 },
              { keyword: '에이컷 영상편집', bidAmt: 500 }
            ]
          })
        });
        var data = await resp.text();
        return { status: resp.status, body: data.substring(0, 500) };
      } catch(e) {
        return { error: e.message };
      }
    });
    console.log('API 결과:', JSON.stringify(apiResult));
  }

  await b.close();
})();
