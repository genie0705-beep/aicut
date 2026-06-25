// 키워드 추가 - 최종 확정
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

  // 새 키워드 클릭
  console.log('1. 새 키워드 버튼 클릭...');
  await adPage.evaluate(function() {
    var all = document.querySelectorAll('a, button, span, div');
    for (var i = 0; i < all.length; i++) {
      if ((all[i].innerText || '').trim() === '새 키워드' && all[i].offsetParent !== null) {
        all[i].click(); return;
      }
    }
  });
  await sleep(2000);

  // text 입력창 찾기 (search 타입 제외)
  console.log('2. 키워드 입력...');
  var typed = await adPage.evaluate(function() {
    var inputs = document.querySelectorAll('input');
    for (var i = 0; i < inputs.length; i++) {
      var inp = inputs[i];
      if (inp.type === 'text' && inp.offsetParent !== null) {
        // 이 input에 focus
        inp.focus();
        // dispatch input event
        var nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeInputValueSetter.call(inp, '에이컷');
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        return { ok: true };
      }
    }
    return { ok: false, count: inputs.length };
  });
  console.log('   입력:', JSON.stringify(typed));
  await sleep(500);

  // Enter 키
  var enterPressed = await adPage.evaluate(function() {
    // 모달 내 '추가' 버튼 먼저 찾기
    var all = document.querySelectorAll('a, button, span, div');
    for (var i = 0; i < all.length; i++) {
      var t = (all[i].innerText || '').trim();
      if ((t === '추가' || t === 'add') && all[i].offsetParent !== null) {
        var rect = all[i].getBoundingClientRect();
        if (rect.width > 30) {
          all[i].click();
          return { by: 'addBtn', text: t };
        }
      }
    }
    return { by: 'none' };
  });
  console.log('   Enter/추가:', JSON.stringify(enterPressed));
  await sleep(1000);

  // AICUT 입력
  var typed2 = await adPage.evaluate(function() {
    var inputs = document.querySelectorAll('input');
    for (var i = 0; i < inputs.length; i++) {
      var inp = inputs[i];
      if (inp.type === 'text' && inp.offsetParent !== null) {
        inp.focus();
        var nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeInputValueSetter.call(inp, 'AICUT');
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }
    }
    return false;
  });
  await sleep(500);

  var enterPressed2 = await adPage.evaluate(function() {
    var all = document.querySelectorAll('a, button, span, div');
    for (var i = 0; i < all.length; i++) {
      var t = (all[i].innerText || '').trim();
      if ((t === '추가' || t === 'add') && all[i].offsetParent !== null) {
        var rect = all[i].getBoundingClientRect();
        if (rect.width > 30) {
          all[i].click();
          return true;
        }
      }
    }
    return false;
  });
  console.log('   AICUT 추가:', enterPressed2 ? '✅' : '⚠️');
  await sleep(1000);

  // '저장하고 계속하기' 버튼 클릭
  console.log('3. 저장하고 계속하기...');
  var saved = await adPage.evaluate(function() {
    var all = document.querySelectorAll('a, button, span, div');
    for (var i = 0; i < all.length; i++) {
      var t = (all[i].innerText || '').trim();
      if (t === '저장하고 계속하기' && all[i].offsetParent !== null) {
        all[i].click();
        return true;
      }
    }
    return false;
  });
  console.log('   결과:', saved ? '✅' : '❌');
  await sleep(3000);

  // 리로드 후 최종 확인
  console.log('4. 최종 확인...');
  await adPage.reload({ waitUntil: 'networkidle', timeout: 15000 }).catch(function(){});
  await sleep(3000);

  var result = await adPage.evaluate(function() {
    var body = document.body.innerText;
    var r = { hasEcut: false, hasAicut: false, keywords: [] };
    
    // 키워드 목록 테이블에서 검색
    var rows = document.querySelectorAll('tr');
    rows.forEach(function(row) {
      var text = (row.innerText || '').trim();
      if (text.indexOf('에이컷') >= 0 && text.length < 100) {
        r.hasEcut = true;
        r.keywords.push('에이컷: ' + text.substring(0, 80));
      }
      if (text.indexOf('AICUT') >= 0 && text.length < 100) {
        r.hasAicut = true;
        r.keywords.push('AICUT: ' + text.substring(0, 80));
      }
    });
    
    // body 전체 검색 backup
    if (!r.hasEcut) r.hasEcut = body.indexOf('에이컷') >= 0;
    if (!r.hasAicut) r.hasAicut = body.indexOf('AICUT') >= 0;
    
    return r;
  });

  console.log('\\n=== 최종 키워드 확인 ===');
  console.log(JSON.stringify(result, null, 2));
  
  if (result.hasEcut || result.hasAicut) {
    console.log('\\n✅ 키워드 추가 성공!');
  } else {
    console.log('\\n⚠️ 키워드 추가 미확인');
  }

  await b.close();
})();
