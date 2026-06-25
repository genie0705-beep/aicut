const { chromium } = require('playwright');
const CDP_PORT = 9224;
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  console.log('=== 네이버 광고 입찰가 인상 (2,500원 → 3,500원) ===\n');

  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  // 광고그룹 페이지로 이동
  console.log('1. 광고그룹 페이지 이동...');
  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566', { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(3000);
  console.log('   URL:', page.url().substring(0, 100));

  // "수정" 버튼 찾기 (광고그룹 정보 수정)
  console.log('2. 광고그룹 정보 수정 버튼 찾기...');
  var btnInfo = await page.evaluate(function() {
    // "수정" 텍스트를 가진 버튼/링크 찾기
    var els = document.querySelectorAll('button, a, span, div[role="button"]');
    for (var i = 0; i < els.length; i++) {
      var t = (els[i].innerText || '').trim();
      // '수정'이면서 광고그룹 정보 영역 근처
      if (t === '수정' && els[i].offsetParent !== null) {
        // 주변 텍스트에 '광고그룹 정보'가 있는지 확인
        var parent = els[i].closest('div, section, article');
        if (parent) {
          var parentText = parent.innerText || '';
          if (parentText.includes('광고그룹 정보') || parentText.includes('기본 입찰가')) {
            els[i].click();
            return 'clicked near group info';
          }
        }
        els[i].click();
        return 'clicked';
      }
    }
    return 'not found';
  });
  console.log('   결과:', btnInfo);
  await sleep(2000);

  // 현재 페이지 상태 확인 (수정 모드 진입 후 변경된 UI)
  var pageAfterEdit = await page.evaluate(function() {
    return {
      url: window.location.href.substring(0, 80),
      hasInputs: document.querySelectorAll('input').length,
      buttonTexts: Array.from(document.querySelectorAll('button')).filter(function(b) { return b.offsetParent !== null; }).slice(0, 5).map(function(b) { return b.innerText.trim().substring(0, 20); })
    };
  });
  console.log('   수정 후 상태:', JSON.stringify(pageAfterEdit));

  // 기본 입찰가 입력 필드 찾기
  console.log('3. 기본 입찰가 입력 필드 찾기...');
  var bidField = await page.$('input[type="number"], input[placeholder*="입찰"], input[name*="bid"], input[class*="bid"]');
  if (!bidField) {
    // 모든 input 확인
    var inputInfo = await page.evaluate(function() {
      return Array.from(document.querySelectorAll('input')).filter(function(inp) { return inp.offsetParent !== null; }).slice(0, 10).map(function(inp) {
        return { type: inp.type, name: inp.name, placeholder: inp.placeholder, value: inp.value, id: inp.id };
      });
    });
    console.log('   visible inputs:', JSON.stringify(inputInfo));
    
    // value가 "2,500"인 input 찾기
    for (var i = 0; i < inputInfo.length; i++) {
      if (inputInfo[i].value && (inputInfo[i].value.includes('2,500') || inputInfo[i].value.includes('2500'))) {
        var inputs = await page.$$('input');
        bidField = inputs[i];
        console.log('   입찰가 input 발견 (인덱스 ' + i + ')');
        break;
      }
    }
  }

  if (bidField) {
    await bidField.click({ force: true });
    await sleep(500);
    // 기존 값 지우고 새 값 입력
    await bidField.evaluate(function(el) { el.value = ''; });
    await sleep(300);
    await page.keyboard.type('3500', { delay: 50 });
    await sleep(500);
    
    // 저장/완료 버튼 찾기
    console.log('4. 저장/완료 버튼 클릭...');
    var saved = await page.evaluate(function() {
      var btns = Array.from(document.querySelectorAll('button'));
      for (var i = 0; i < btns.length; i++) {
        var t = (btns[i].innerText || '').trim();
        if ((t === '저장' || t === '완료' || t === '확인') && btns[i].offsetParent !== null && !btns[i].disabled) {
          btns[i].click();
          return true;
        }
      }
      return false;
    });
    console.log('   저장:', saved ? '✅' : '❌');
    await sleep(3000);
    
    // 결과 확인
    var bidText = await page.evaluate(function() {
      var allText = document.body.innerText || '';
      // '기본 입찰가' 근처 숫자 찾기
      var idx = allText.indexOf('기본 입찰가');
      if (idx >= 0) return allText.substring(idx, idx + 50);
      return '알 수 없음';
    });
    console.log('   변경 후:', bidText);
    
  } else {
    console.log('   ❌ 입찰가 입력 필드 못 찾음');
    
    // 대체 방법: 페이지 직접 URL로 이동해서 입찰가 편집 파라미터 추가
    console.log('   → 대체 방법 시도...');
  }

  await b.close();
  console.log('\n✅ 완료');
})();
