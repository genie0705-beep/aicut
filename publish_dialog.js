const { chromium } = require('playwright');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  var pages = ctx.pages();
  
  var page = null;
  for (var p of pages) {
    if (p.url().includes('postwrite')) { page = p; break; }
  }
  if (!page) { console.log('no page'); await b.close(); return; }
  
  await page.bringToFront();
  await sleep(2000);

  // 발행 다이얼로그에서 "발행" 버튼 찾기
  var clicked = await page.evaluate(function() {
    // 1. 레이어/팝업 내부의 발행 버튼
    var layers = document.querySelectorAll('[class*="layer"], [class*="popup"], [role="dialog"]');
    for (var layer of layers) {
      if (layer.offsetParent !== null) { // visible
        var btns = layer.querySelectorAll('button');
        for (var btn of btns) {
          if (btn.textContent.trim() === '발행' || btn.textContent.trim() === '확인') {
            btn.click();
            return '레이어 내부 발행 클릭';
          }
        }
      }
    }
    
    // 2. 모든 visible 버튼 중 "발행"
    var allBtns = document.querySelectorAll('button');
    for (var btn of allBtns) {
      if (btn.offsetParent !== null && btn.textContent.trim() === '발행') {
        // 부모 중 다이얼로그가 있는지
        var parent = btn.closest('[class*="layer"], [class*="popup"], [role="dialog"]');
        if (parent) {
          btn.click();
          return 'visible+레이어 발행';
        }
      }
    }
    
    return '발행 버튼 못 찾음';
  });
  console.log('1차:', clicked);
  await sleep(3000);

  // 결과 확인
  var url = await page.evaluate(function() { return window.location.href; });
  console.log('URL:', url.substring(0, 80));
  
  if (url.includes('postwrite')) {
    console.log('아직 postwrite. 한번 더 시도...');
    
    // 모든 발행 버튼 visible인 것 클릭
    var r2 = await page.evaluate(function() {
      var btns = document.querySelectorAll('button');
      var lastBtn = null;
      for (var btn of btns) {
        if (btn.textContent.trim() === '발행' && btn.offsetParent !== null) {
          lastBtn = btn;
        }
      }
      if (lastBtn) { lastBtn.click(); return '마지막 발행 클릭'; }
      return '없음';
    });
    console.log('2차:', r2);
    await sleep(3000);
    
    var url2 = await page.evaluate(function() { return window.location.href; });
    console.log('URL2:', url2.substring(0, 80));
    
    if (url2.includes('postwrite')) {
      // 버튼 현황
      var btns = await page.evaluate(function() {
        return Array.from(document.querySelectorAll('button'))
          .filter(function(b) { return b.offsetParent !== null; })
          .map(function(b) { return b.textContent.trim(); })
          .filter(function(v,i,a){return a.indexOf(v)===i;})
          .slice(0, 10);
      });
      console.log('버튼들:', JSON.stringify(btns));
    } else {
      console.log('✅ 발행 완료!');
    }
  } else if (url.includes('PostView')) {
    console.log('✅ 발행 완료! PostView로 이동됨');
  } else {
    console.log('ℹ️ 기타 페이지');
  }

  await b.close();
})().catch(e => console.error('❌', e.message));
