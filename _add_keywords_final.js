// 키워드 추가 최종 - 모달 저장 버튼 찾기 + 리로드 확인
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

  // 새 키워드 버튼 클릭
  await adPage.evaluate(function() {
    var all = document.querySelectorAll('a, button, span, div');
    for (var i = 0; i < all.length; i++) {
      var t = (all[i].innerText || '').trim();
      if (t === '새 키워드' && all[i].offsetParent !== null) {
        all[i].click(); return;
      }
    }
  });
  await sleep(3000);

  // 모달 내부 텍스트 확인
  var modalText = await adPage.evaluate(function() {
    // 새로 나타난 텍스트 영역 확인
    var all = document.querySelectorAll('*');
    var r = { texts: [] };
    for (var i = 0; i < all.length; i++) {
      var t = (all[i].innerText || '').trim();
      if (t && t.length < 20 && all[i].offsetParent !== null) {
        r.texts.push(t);
      }
    }
    // 중복 제거
    r.unique = [];
    for (var i = 0; i < r.texts.length; i++) {
      if (r.unique.indexOf(r.texts[i]) < 0) r.unique.push(r.texts[i]);
    }
    return r.unique;
  });
  
  console.log('모달 내 텍스트들:');
  modalText.forEach(function(t, i) {
    console.log('  [' + i + '] ' + t);
  });

  // 저장/등록/완료 버튼 텍스트 찾아서 클릭
  var saveBtn = await adPage.evaluate(function() {
    var candidates = ['저장', '등록', '완료', '확인', '추가', '적용', 'keyword'];
    var all = document.querySelectorAll('a, button, span, div');
    for (var c = 0; c < candidates.length; c++) {
      for (var i = 0; i < all.length; i++) {
        var t = (all[i].innerText || '').trim();
        if (t === candidates[c] && all[i].offsetParent !== null) {
          var rect = all[i].getBoundingClientRect();
          if (rect.width > 30 && rect.height > 20) {
            all[i].click();
            return { text: t, tag: all[i].tagName };
          }
        }
      }
    }
    return null;
  });
  console.log('\n저장 버튼:', JSON.stringify(saveBtn));
  
  if (!saveBtn) {
    // 모달 닫기 (ESC)
    await adPage.keyboard.press('Escape');
    await sleep(1000);
    console.log('저장 버튼 없음, API 최종 시도');
    
    // nccAdgroupId 파라미터로 API 호출
    var apiResult = await adPage.evaluate(async function() {
      try {
        var resp = await fetch('https://ads.naver.com/apis/sa/api/ncc/keywords', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nccAdgroupId: 'grp-a001-01-000000065663566',
            keywords: [
              { keyword: '에이컷', bidAmt: 500 },
              { keyword: 'AICUT', bidAmt: 500 }
            ]
          })
        });
        var data = await resp.text();
        return { status: resp.status, body: data.substring(0, 500) };
      } catch(e) {
        return { error: e.message };
      }
    });
    console.log('API 최종:', JSON.stringify(apiResult));
  }

  // 페이지 리로드 후 키워드 확인
  await sleep(2000);
  await adPage.reload({ waitUntil: 'networkidle', timeout: 15000 }).catch(function(){});
  await sleep(3000);
  
  var hasKeyword = await adPage.evaluate(function() {
    var body = document.body.innerText;
    return {
      hasEcut: body.indexOf('에이컷') >= 0,
      hasAicut: body.indexOf('AICUT') >= 0,
      context: body.indexOf('에이컷') >= 0 ? '에이컷 발견됨' : '에이컷 없음'
    };
  });
  console.log('\n리로드 후:', JSON.stringify(hasKeyword));

  await b.close();
})();
