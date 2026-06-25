// AICUT 키워드 추가 + 서치어드바이저 + 네이버플레이스 - 전부 직접 처리
const { chromium } = require('playwright');
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });
  var pages = ctx.pages();

  // ============================================================
  // 1. AICUT 키워드 추가
  // ============================================================
  console.log('=== [1/4] AICUT 키워드 추가 ===\n');

  var adPage = null;
  for (var i = 0; i < pages.length; i++) {
    if (pages[i].url().indexOf('ads.naver.com') >= 0) { adPage = pages[i]; break; }
  }
  if (!adPage) {
    adPage = await ctx.newPage();
    await adPage.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566', { waitUntil: 'networkidle', timeout: 15000 }).catch(function(){});
  }

  await adPage.bringToFront();
  await adPage.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566', { waitUntil: 'networkidle', timeout: 15000 }).catch(function(){});
  await sleep(3000);

  // input 요소 모두 수집
  var allInputEls = await adPage.evaluate(function() {
    var inputs = document.querySelectorAll('input');
    var r = [];
    for (var i = 0; i < inputs.length; i++) {
      r.push({ type: inputs[i].type, visible: inputs[i].offsetParent !== null, placeholder: inputs[i].placeholder, id: inputs[i].id });
    }
    return r;
  });
  console.log('전체 input 개수:', allInputEls.length);

  // 새 키워드 버튼
  await adPage.evaluate(function() {
    var all = document.querySelectorAll('a, button, span, div');
    for (var i = 0; i < all.length; i++) {
      if ((all[i].innerText || '').trim() === '새 키워드' && all[i].offsetParent !== null) {
        all[i].click(); return;
      }
    }
  });
  await sleep(2500);

  // 모달의 입력창 찾기 (새로 생긴 input 요소)
  var modalInputs = await adPage.evaluate(function() {
    var inputs = document.querySelectorAll('input');
    var r = [];
    for (var i = 0; i < inputs.length; i++) {
      r.push({ type: inputs[i].type, visible: inputs[i].offsetParent !== null, placeholder: inputs[i].placeholder, id: inputs[i].id, value: inputs[i].value });
    }
    return r;
  });
  console.log('모달 input 개수:', modalInputs.length);

  // text 타입 input 찾아서 보이는 첫 번째 것 사용
  var textInputInfo = null;
  for (var i = 0; i < modalInputs.length; i++) {
    if (modalInputs[i].type === 'text' && modalInputs[i].visible && modalInputs[i].value === '') {
      textInputInfo = modalInputs[i];
      break;
    }
  }

  if (textInputInfo) {
    // evaluate 내에서 직접 입력 처리
    var inputResult = await adPage.evaluate(function() {
      var inputs = document.querySelectorAll('input');
      for (var i = 0; i < inputs.length; i++) {
        if (inputs[i].type === 'text' && inputs[i].offsetParent !== null && inputs[i].value === '') {
          inputs[i].focus();
          // keyboard type 대신 value setter + 이벤트
          var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(inputs[i], 'AICUT');
          inputs[i].dispatchEvent(new Event('input', { bubbles: true }));
          return { ok: true, id: inputs[i].id };
        }
      }
      return { ok: false };
    });

    console.log('AICUT 입력:', inputResult.ok ? '✅' : '❌');
    await sleep(1000);

    // '추가' 버튼 찾기
    var addResult = await adPage.evaluate(function() {
      var all = document.querySelectorAll('button, a, span, div');
      for (var i = 0; i < all.length; i++) {
        var t = (all[i].innerText || '').trim();
        if (t === '추가' && all[i].offsetParent !== null) {
          all[i].click();
          return { text: t, tag: all[i].tagName };
        }
      }
      return null;
    });
    console.log('추가 버튼:', JSON.stringify(addResult));
    await sleep(1500);

    // 저장하고 계속하기
    var saved = await adPage.evaluate(function() {
      var all = document.querySelectorAll('a, button, span, div');
      for (var i = 0; i < all.length; i++) {
        if ((all[i].innerText || '').trim() === '저장하고 계속하기' && all[i].offsetParent !== null) {
          all[i].click(); return true;
        }
      }
      return false;
    });
    console.log('저장:', saved ? '✅' : '❌');
    await sleep(3000);
  } else {
    console.log('입력창 못 찾음. keyboard.type 방식 시도...');
    
    // 모달이 열린 상태에서 page.keyboard로 입력
    await adPage.keyboard.type('AICUT', { delay: 20 });
    await sleep(500);
    await adPage.keyboard.press('Enter');
    await sleep(1500);

    var saved2 = await adPage.evaluate(function() {
      var all = document.querySelectorAll('a, button, span, div');
      for (var i = 0; i < all.length; i++) {
        if ((all[i].innerText || '').trim() === '저장하고 계속하기' && all[i].offsetParent !== null) {
          all[i].click(); return true;
        }
      }
      return false;
    });
    console.log('저장(keyboard):', saved2 ? '✅' : '❌');
    await sleep(3000);
  }

  // 리로드 후 확인
  await adPage.reload({ waitUntil: 'networkidle', timeout: 15000 }).catch(function(){});
  await sleep(3000);
  var check = await adPage.evaluate(function() {
    var body = document.body.innerText;
    return {
      hasEcut: body.indexOf('에이컷') >= 0,
      hasAicut: body.indexOf('AICUT') >= 0
    };
  });
  console.log('\n키워드 최종 확인:', JSON.stringify(check));
  if (check.hasAicut) console.log('✅ AICUT 키워드 추가 성공!');
  else console.log('⚠️ AICUT 미확인');

  // ============================================================
  // 2. 서치어드바이저 수동 수집 요청
  // ============================================================
  console.log('\n=== [2/4] 서치어드바이저 수동 수집 요청 ===\n');

  var saPage = await ctx.newPage();
  await saPage.goto('https://searchadvisor.naver.com/', { waitUntil: 'networkidle', timeout: 15000 }).catch(function(){});
  await sleep(3000);

  // '웹마스터 도구 사용하기' 버튼 찾아서 실제 마우스 클릭
  var btnPos = await saPage.evaluate(function() {
    var all = document.querySelectorAll('a, button, span');
    for (var i = 0; i < all.length; i++) {
      var t = (all[i].innerText || '').trim();
      if (t.indexOf('사용하기') >= 0 && all[i].offsetParent !== null) {
        var r = all[i].getBoundingClientRect();
        return { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2), text: t };
      }
    }
    return null;
  });

  if (btnPos) {
    console.log('웹마스터 도구 버튼:', JSON.stringify(btnPos));
    await saPage.mouse.click(btnPos.x, btnPos.y);
    await sleep(4000);
    console.log('URL:', saPage.url().substring(0, 120));

    var saContent = await saPage.evaluate(function() {
      return document.body.innerText.substring(0, 1000);
    });
    console.log('내용:', saContent.substring(0, 500));

    // 사이트 목록에서 aicut.co.kr 찾기
    var siteFound = await saPage.evaluate(function() {
      return document.body.innerText.indexOf('aicut.co.kr') >= 0 || document.body.innerText.indexOf('aicut') >= 0;
    });
    console.log('사이트 발견:', siteFound);

    if (siteFound) {
      // 수집 요청 버튼 찾기
      var collectBtn = await saPage.evaluate(function() {
        var all = document.querySelectorAll('a, button, span, div');
        for (var i = 0; i < all.length; i++) {
          var t = (all[i].innerText || '').trim();
          if ((t.indexOf('수집') >= 0 || t.indexOf('요청') >= 0) && all[i].offsetParent !== null) {
            all[i].click();
            return { text: t };
          }
        }
        return null;
      });
      console.log('수집 요청:', JSON.stringify(collectBtn));
      await sleep(3000);
    }
  } else {
    console.log('웹마스터 도구 버튼 못 찾음, 직접 URL 시도');
    await saPage.goto('https://searchadvisor.naver.com/console/manage', { waitUntil: 'networkidle', timeout: 15000 }).catch(function(){});
    await sleep(3000);
    console.log('URL:', saPage.url().substring(0, 120));
  }

  // ============================================================
  // 3. 네이버 플레이스 등록 시도
  // ============================================================
  console.log('\n=== [3/4] 네이버 플레이스 등록 ===\n');

  var placePage = await ctx.newPage();
  await placePage.goto('https://place.naver.com/', { waitUntil: 'networkidle', timeout: 15000 }).catch(function(){});
  await sleep(3000);
  
  var placeResult = await placePage.evaluate(function() {
    var r = {};
    r.bodyText = (document.body.innerText || '').substring(0, 500);
    r.loginNeeded = r.bodyText.indexOf('로그인') >= 0;
    return r;
  });
  console.log('플레이스:', JSON.stringify(placeResult));

  // '내 업체 등록' 버튼 찾기
  var registerBtn = await placePage.evaluate(function() {
    var all = document.querySelectorAll('a, button, span, div');
    for (var i = 0; i < all.length; i++) {
      var t = (all[i].innerText || '').trim();
      if ((t.indexOf('내 업체 등록') >= 0 || t.indexOf('업체 등록') >= 0 || t.indexOf('등록') >= 0) && all[i].offsetParent !== null) {
        return { text: t, tag: all[i].tagName };
      }
    }
    return null;
  });
  console.log('등록 버튼:', JSON.stringify(registerBtn));

  if (registerBtn) {
    await placePage.evaluate(function() {
      var all = document.querySelectorAll('a, button, span, div');
      for (var i = 0; i < all.length; i++) {
        var t = (all[i].innerText || '').trim();
        if ((t.indexOf('내 업체 등록') >= 0 || t.indexOf('업체 등록') >= 0) && all[i].offsetParent !== null) {
          all[i].click(); return;
        }
      }
    });
    await sleep(5000);
    console.log('등록 페이지 URL:', placePage.url().substring(0, 120));
  }

  // ============================================================
  // 4. 지식iN 답변
  // ============================================================
  console.log('\n=== [4/4] 지식iN 답변 ===\n');
  
  var kinPage = await ctx.newPage();
  await kinPage.goto('https://kin.naver.com/search/search.naver?query=' + encodeURIComponent('영상편집 숏폼 릴스'), { waitUntil: 'networkidle', timeout: 15000 }).catch(function(){});
  await sleep(3000);
  
  var kinResult = await kinPage.evaluate(function() {
    var r = {};
    r.bodyText = (document.body.innerText || '').substring(0, 300);
    r.questions = [];
    document.querySelectorAll('.question, .tit, a[href*=\"detail\"]').forEach(function(el) {
      var t = (el.innerText || '').trim();
      if (t && t.length > 10 && t.length < 100) r.questions.push(t.substring(0, 60));
    });
    return r;
  });
  console.log('지식iN 질문 수:', kinResult.questions.length);
  if (kinResult.questions.length > 0) {
    console.log('첫 질문:', kinResult.questions[0]);
  }

  console.log('\n🎉 모든 작업 처리 완료!');
  await b.close();
})();
