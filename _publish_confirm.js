// 발행 설정 모달 처리
const { chromium } = require('playwright');

function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });
  var pages = ctx.pages();
  var pwPage = null;
  for (var i = 0; i < pages.length; i++) {
    if (pages[i].url().indexOf('PostWriteForm') >= 0) { pwPage = pages[i]; break; }
  }
  if (!pwPage) { console.log('no page'); await b.close(); return; }
  
  await pwPage.bringToFront();
  await sleep(2000);
  
  // 발행 설정 모달 내 '발행' 버튼 찾기
  var clicked = await pwPage.evaluate(function() {
    var btns = document.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      var t = (btns[i].innerText || '').trim();
      // '발행' 버튼 중에서 '발행 설정 닫기' 아닌 것
      if (t === '발행' && btns[i].offsetParent !== null) {
        // Check if this button is inside a modal/popup
        var parent = btns[i];
        while (parent) {
          var cls = parent.className || '';
          if (cls.indexOf('layer') >= 0 || cls.indexOf('modal') >= 0 || cls.indexOf('popup') >= 0 || cls.indexOf('dialog') >= 0) {
            btns[i].click();
            return { found: true, inModal: true, text: t };
          }
          parent = parent.parentElement;
        }
      }
    }
    // 모달 내 버튼 못 찾았으면 전체에서 두 번째 '발행' 버튼 찾기
    var count = 0;
    for (var i = 0; i < btns.length; i++) {
      var t = (btns[i].innerText || '').trim();
      if (t === '발행' && btns[i].offsetParent !== null) {
        count++;
        if (count === 2) {
          btns[i].click();
          return { found: true, by: 'second', text: t };
        }
      }
    }
    return { found: false };
  });
  
  console.log('발행 확인:', JSON.stringify(clicked));
  await sleep(5000);
  
  var url = pwPage.url();
  console.log('URL:', url.substring(0, 120));
  
  // 발행 후 게시물 페이지로 이동했는지 확인
  if (url.indexOf('PostWriteForm') < 0) {
    console.log('✅ 발행 완료! 게시물 페이지로 이동됨');
  } else {
    console.log('⚠️ 아직 작성 페이지');
    
    // 다시 한번 발행 버튼 체크
    var btns = await pwPage.evaluate(function() {
      var visibleBtns = [];
      document.querySelectorAll('button').forEach(function(b) {
        if (b.offsetParent !== null) {
          var t = (b.innerText || '').trim();
          if (t) visibleBtns.push(t);
        }
      });
      return visibleBtns;
    });
    console.log('가시 버튼:', JSON.stringify(btns));
  }
  
  await b.close();
})();
