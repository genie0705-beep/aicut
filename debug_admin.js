const { chromium } = require('playwright');
const CDP_PORT = 9224;
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  var pages = ctx.pages();
  var page = null;
  for (var i = 0; i < pages.length; i++) {
    var u = pages[i].url();
    if (u.includes('memorial_admin')) {
      page = pages[i];
      break;
    }
  }
  if (!page) {
    console.log('페이지 찾을 수 없음');
    await b.close();
    return;
  }
  
  // 콘솔 오류 확인
  var errors = await page.evaluate(function() {
    return window.__capturedErrors || [];
  }).catch(function(e) { return 'evaluate 불가: ' + e.message; });
  console.log('저장된 에러:', errors);
  
  // 페이지 URL 확인
  console.log('페이지 URL:', page.url().substring(0, 100));
  
  // 기본 요소 확인
  var check = await page.evaluate(function() {
    var result = {};
    result.hasGrid = document.getElementById('dash-loc-grid') !== null;
    result.hasSettings = document.getElementById('location-structure-select') !== null;
    result.hasQuantityFields = document.getElementById('location-quantity-fields') !== null;
    result.hasNavItems = document.querySelectorAll('.nav-item').length;
    result.bodyText = (document.body.innerText || '').substring(0, 200);
    result.consoleErrors = [];
    // 기본 함수 존재 확인
    result.hasBuildGrid = typeof buildLocationGrid === 'function';
    result.hasGetCount = typeof getLocationCount === 'function';
    result.hasUpdateQty = typeof updateQuantityFields === 'function';
    return result;
  });
  
  console.log('페이지 상태:', JSON.stringify(check, null, 2));
  
  // JavaScript 실행 에러 캡처
  await page.evaluate(function() {
    window.__capturedErrors = [];
    window.addEventListener('error', function(e) {
      window.__capturedErrors.push(e.message + ' at ' + (e.filename || '') + ':' + (e.lineno || ''));
    });
  });
  
  // 페이지 새로고침 후 에러 확인
  await page.reload();
  await sleep(3000);
  
  var errorsAfter = await page.evaluate(function() {
    return window.__capturedErrors || [];
  });
  console.log('\n새로고침 후 에러:', errorsAfter);
  
  // 다시 상태 확인
  var stateAfter = await page.evaluate(function() {
    var r = {};
    r.hasGrid = document.getElementById('dash-loc-grid') !== null;
    r.gridChildCount = document.getElementById('dash-loc-grid')?.children?.length || 0;
    r.hasFullGrid = document.getElementById('full-loc-grid') !== null;
    r.fullGridChildren = document.getElementById('full-loc-grid')?.children?.length || 0;
    r.navItems = document.querySelectorAll('.nav-item').length;
    r.activePage = document.querySelector('.page.active')?.dataset?.page || 'none';
    return r;
  });
  console.log('새로고침 후 상태:', JSON.stringify(stateAfter, null, 2));
  
  await b.close();
})();
