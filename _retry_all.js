// 2차 실행: AICUT + 서치어드바이저 + 플레이스 + 지식iN
const { chromium } = require('playwright');
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });
  var pages = ctx.pages();

  // ============================================================
  // 1. AICUT 키워드 추가 (재시도)
  // ============================================================
  console.log('=== [1] AICUT 키워드 추가 ===\n');

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

  // 먼저 현재 키워드 목록 확인
  var initialList = await adPage.evaluate(function() {
    var body = document.body.innerText;
    return { hasEcut: body.indexOf('에이컷') >= 0, hasAicut: body.indexOf('AICUT') >= 0 };
  });
  console.log('현재 키워드:', JSON.stringify(initialList));

  // 새 키워드 버튼 클릭
  await adPage.evaluate(function() {
    var all = document.querySelectorAll('a, button, span, div');
    for (var i = 0; i < all.length; i++) {
      if ((all[i].innerText || '').trim() === '새 키워드' && all[i].offsetParent !== null) {
        all[i].click(); return;
      }
    }
  });
  await sleep(2500);

  // keyboard.type 직접 사용 (Playwright의 실제 타이핑)
  // 먼저 text input이 포커스되어 있는지 확인
  var focused = await adPage.evaluate(function() {
    var el = document.activeElement;
    if (el && el.tagName === 'INPUT' && el.type === 'text') return true;
    // 포커스 강제 설정
    var inputs = document.querySelectorAll('input');
    for (var i = 0; i < inputs.length; i++) {
      if (inputs[i].type === 'text' && inputs[i].offsetParent !== null) {
        inputs[i].focus();
        return true;
      }
    }
    return false;
  });
  console.log('포커스:', focused ? '✅' : '❌');

  await sleep(500);
  
  // AICUT 타이핑
  await adPage.keyboard.type('AICUT', { delay: 20 });
  await sleep(800);

  // 모달 내 '추가' 버튼 클릭 (A 태그)
  var addResult = await adPage.evaluate(function() {
    // 모달 내 '선택한 키워드' 영역 확인
    var all = document.querySelectorAll('a, button, span');
    for (var i = 0; i < all.length; i++) {
      var t = (all[i].innerText || '').trim();
      // '추가' 버튼 중에서 입력창 근처에 있는 것
      if (t === '추가' && all[i].offsetParent !== null && all[i].tagName === 'A') {
        all[i].click();
        return { text: t, tag: all[i].tagName, html: all[i].outerHTML.substring(0, 100) };
      }
    }
    return null;
  });
  console.log('추가 버튼:', JSON.stringify(addResult));
  await sleep(1500);

  // 선택된 키워드 개수 확인
  var selectedCount = await adPage.evaluate(function() {
    var body = document.body.innerText;
    // '선택한 키워드(X / 100)' 찾기
    var idx = body.indexOf('선택한 키워드');
    if (idx >= 0) return body.substring(idx, idx + 30);
    return '못 찾음';
  });
  console.log('선택됨:', selectedCount);

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

  // 리로드 확인
  await adPage.reload({ waitUntil: 'networkidle', timeout: 15000 }).catch(function(){});
  await sleep(3000);
  var finalCheck = await adPage.evaluate(function() {
    var body = document.body.innerText;
    return { hasEcut: body.indexOf('에이컷') >= 0, hasAicut: body.indexOf('AICUT') >= 0 };
  });
  console.log('최종:', JSON.stringify(finalCheck));
  if (finalCheck.hasAicut) console.log('✅ AICUT 추가 성공!');
  else console.log('❌ AICUT 아직 미추가, 다른 접근 필요');

  if (!finalCheck.hasAicut) {
    // API 직접 호출 최종 시도 - 올바른 파라미터로
    console.log('\nAPI 직접 호출 최종 시도...');
    var apiResult = await adPage.evaluate(async function() {
      try {
        var resp = await fetch('https://ads.naver.com/apis/sa/api/ncc/keywords', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nccAdgroupId: 'grp-a001-01-000000065663566',
            keywordList: [{ keyword: 'AICUT', bidAmt: 500 }]
          })
        });
        var data = await resp.text();
        return { status: resp.status, body: data.substring(0, 300) };
      } catch(e) {
        return { error: e.message };
      }
    });
    console.log('API:', JSON.stringify(apiResult));
  }

  // ============================================================
  // 2. 서치어드바이저 - JavaScript로 직접 이동
  // ============================================================
  console.log('\n=== [2] 서치어드바이저 ===\n');

  var saPage = await ctx.newPage();
  await saPage.goto('https://searchadvisor.naver.com/', { waitUntil: 'networkidle', timeout: 15000 }).catch(function(){});
  await sleep(3000);

  // 페이지 내 JavaScript로 라우트 변경
  var navResult = await saPage.evaluate(function() {
    // window.__NEXT_DATA__ 확인
    if (window.__NEXT_DATA__) {
      return 'has next data';
    }
    // window.__NEXT_ROUTER
    if (window.__NEXT_ROUTER__) {
      return 'has router';
    }
    // ReactDOM 내부
    var root = document.getElementById('__next');
    if (root) return 'has __next';
    return 'searching...';
  });
  console.log('프레임워크:', navResult);

  // 새 창에서 웹마스터도구 old URL 시도
  var oldWmUrl = 'https://webmaster.naver.com/';
  await saPage.goto(oldWmUrl, { waitUntil: 'networkidle', timeout: 15000 }).catch(function(){});
  await sleep(3000);
  console.log('old URL:', saPage.url().substring(0, 120));

  var oldWmResult = await saPage.evaluate(function() {
    return (document.body.innerText || '').substring(0, 500);
  });
  console.log('old 내용:', oldWmResult.substring(0, 300));

  // ============================================================
  // 3. 네이버 플레이스
  // ============================================================
  console.log('\n=== [3] 네이버 플레이스 ===\n');

  var placePage = await ctx.newPage();
  await placePage.goto('https://m.place.naver.com/', { waitUntil: 'networkidle', timeout: 15000 }).catch(function(){});
  await sleep(3000);
  console.log('m.place URL:', placePage.url().substring(0, 100));
  
  var placeResult = await placePage.evaluate(function() {
    return (document.body.innerText || '').substring(0, 500);
  });
  console.log('m.place:', placeResult.substring(0, 300));

  // ============================================================
  // 4. 지식iN
  // ============================================================
  console.log('\n=== [4] 지식iN 답변 ===\n');

  var kinPage = await ctx.newPage();
  // 지식iN 검색 URL
  await kinPage.goto('https://kin.naver.com/search/search.naver?query=' + encodeURIComponent('영상편집 숏폼'), { waitUntil: 'networkidle', timeout: 15000 }).catch(function(){});
  await sleep(3000);
  console.log('지식iN URL:', kinPage.url().substring(0, 100));

  var kinContent = await kinPage.evaluate(function() {
    return (document.body.innerText || '').substring(0, 800);
  });
  console.log('지식iN:', kinContent.substring(0, 500));

  await b.close();
})();
