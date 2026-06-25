// 모달 UI 정밀 분석
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

  // 새 키워드
  await adPage.evaluate(function() {
    var all = document.querySelectorAll('a, button, span, div');
    for (var i = 0; i < all.length; i++) {
      if ((all[i].innerText || '').trim() === '새 키워드' && all[i].offsetParent !== null) {
        all[i].click(); return;
      }
    }
  });
  await sleep(2500);

  // 모달이 열리면 body HTML 변화 확인
  var modalStructure = await adPage.evaluate(function() {
    var r = {};
    
    // '선택한 키워드' 텍스트 근처 구조
    var allDivs = document.querySelectorAll('div');
    for (var i = 0; i < allDivs.length; i++) {
      var t = (allDivs[i].innerText || '');
      if (t.indexOf('선택한 키워드') >= 0 && t.length < 200 && allDivs[i].offsetParent !== null) {
        r.selectedArea = t.substring(0, 150);
        r.selectedHTML = allDivs[i].innerHTML.substring(0, 400);
        break;
      }
    }
    
    // text input 찾기
    var inputs = document.querySelectorAll('input');
    for (var i = 0; i < inputs.length; i++) {
      if (inputs[i].type === 'text' && inputs[i].offsetParent !== null) {
        r.inputRect = JSON.stringify(inputs[i].getBoundingClientRect());
        var p = inputs[i].parentElement;
        if (p) {
          r.inputParentChildren = [];
          for (var j = 0; j < p.children.length; j++) {
            var c = p.children[j];
            r.inputParentChildren.push({ tag: c.tagName, text: (c.innerText||'').trim().substring(0,20) });
          }
        }
        break;
      }
    }
    
    // '저장하고 계속하기' 버튼 찾기
    var all2 = document.querySelectorAll('a, button, span, div');
    for (var i = 0; i < all2.length; i++) {
      var t = (all2[i].innerText || '').trim();
      if (t === '저장하고 계속하기' && all2[i].offsetParent !== null) {
        r.saveBtnRect = JSON.stringify(all2[i].getBoundingClientRect());
        r.saveBtnTag = all2[i].tagName;
        break;
      }
    }
    
    return r;
  });

  console.log('모달 구조:');
  console.log(JSON.stringify(modalStructure, null, 2));

  // 이제 Playwright keyboard로 직접 입력 + Enter 시도
  if (modalStructure.inputRect) {
    var rect = JSON.parse(modalStructure.inputRect);
    console.log('\n입력창 클릭 및 타이핑...');
    
    await adPage.mouse.click(rect.x + rect.width/2, rect.y + rect.height/2);
    await sleep(500);
    
    // keyboard.type으로 AICUT 입력
    await adPage.keyboard.type('AICUT', { delay: 15 });
    await sleep(1000);
    
    // Enter
    await adPage.keyboard.press('Enter');
    await sleep(2000);

    // '선택한 키워드' 영역 변화 확인
    var afterAdd = await adPage.evaluate(function() {
      var allDivs = document.querySelectorAll('div');
      for (var i = 0; i < allDivs.length; i++) {
        var t = (allDivs[i].innerText || '');
        if (t.indexOf('선택한 키워드') >= 0 && t.length < 200 && allDivs[i].offsetParent !== null) {
          return t.substring(0, 150);
        }
      }
      return 'not found';
    });
    console.log('추가 후 선택영역:', afterAdd);
    
    // 저장하고 계속하기
    if (modalStructure.saveBtnRect) {
      var sRect = JSON.parse(modalStructure.saveBtnRect);
      await adPage.mouse.click(sRect.x + sRect.width/2, sRect.y + sRect.height/2);
      console.log('저장 버튼 클릭 ✅');
      await sleep(3000);
    }
  }

  // 리로드 확인
  await adPage.reload({ waitUntil: 'networkidle', timeout: 15000 }).catch(function(){});
  await sleep(3000);
  var check = await adPage.evaluate(function() {
    return { hasAicut: document.body.innerText.indexOf('AICUT') >= 0 };
  });
  console.log('\nAICUT 최종:', check.hasAicut ? '✅ 추가 성공!' : '❌ 아직 없음');

  await b.close();
})();
