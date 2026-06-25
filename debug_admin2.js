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
    page = await ctx.newPage();
    await page.goto('file:///C:/Users/paul/.openclaw/workspace/memorial_admin.html', { waitUntil: 'networkidle', timeout: 15000 }).catch(function(e){});
    await sleep(3000);
  }
  
  // 콘솔 메시지 캡처
  var messages = [];
  page.on('console', function(msg) {
    messages.push(msg.type() + ': ' + msg.text());
  });
  page.on('pageerror', function(err) {
    messages.push('PAGE_ERROR: ' + err.message);
  });
  
  await page.reload();
  await sleep(4000);
  
  console.log('=== 콘솔 메시지 ===');
  messages.forEach(function(m) { console.log(m); });
  
  if (messages.length === 0) {
    console.log('(메시지 없음 - 페이지가 조용히 로드됨)');
  }
  
  // 함수 존재 확인
  var funcCheck = await page.evaluate(function() {
    var names = ['buildLocationGrid', 'getLocationCount', 'updateQuantityFields', 'recalcTotal', 'rebuildAllGrids', 'showToast', 'showLocTooltip'];
    var r = {};
    names.forEach(function(n) {
      r[n] = typeof window[n] === 'function';
    });
    return r;
  });
  console.log('\n=== 함수 존재 여부 ===');
  console.log(JSON.stringify(funcCheck, null, 2));
  
  // 대시보드 그리드 상태
  var gridCheck = await page.evaluate(function() {
    var dash = document.getElementById('dash-loc-grid');
    var full = document.getElementById('full-loc-grid');
    return {
      dashExists: !!dash,
      dashChildren: dash ? dash.children.length : 0,
      fullExists: !!full,
      fullChildren: full ? full.children.length : 0,
      locGridCSS: dash ? dash.className : ''
    };
  });
  console.log('\n=== 그리드 상태 ===');
  console.log(JSON.stringify(gridCheck, null, 2));
  
  await b.close();
})();
