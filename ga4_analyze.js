const { chromium } = require('playwright');
const CDP_PORT = 9224;
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  console.log('=== GA4 데이터 분석 ===\n');
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  // GA4 접속
  console.log('1. GA4 접속...');
  await page.goto('https://analytics.google.com/', { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(function(e) { console.log('  로딩 경고:', e.message.substring(0, 50)); });
  await sleep(3000);
  console.log('   URL:', page.url().substring(0, 100));

  // 로그인 상태 확인
  var loginCheck = await page.evaluate(function() {
    var text = document.body.innerText || '';
    return {
      isLoggedIn: !text.includes('로그인') || text.includes('analytics'),
      preview: text.substring(0, 300)
    };
  });
  console.log('   로그인 상태:', loginCheck.isLoggedIn ? '✅' : '❌');

  if (!loginCheck.isLoggedIn) {
    console.log('   로그인 필요 - 페이지 텍스트:', loginCheck.preview);
  }

  // GA4 속성 찾아서 대시보드 열기
  // 일반적인 GA4 URL: https://analytics.google.com/analytics/web/#/p[PROPERTY_ID]
  console.log('\n2. GA4 속성 접속...');
  await page.goto('https://analytics.google.com/analytics/web/#/p538910436', { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(5000);
  console.log('   URL:', page.url().substring(0, 100));

  // 홈/리포트 데이터 확인
  var gaData = await page.evaluate(function() {
    var text = document.body.innerText || '';
    // 주요 지표 찾기
    var result = {};
    
    // 사용자/세션 데이터
    var markers = ['사용자', '세션', '조회수', '페이지뷰', '전환', '수익', '유입'];
    for (var i = 0; i < markers.length; i++) {
      var idx = text.indexOf(markers[i]);
      if (idx >= 0) {
        result[markers[i]] = text.substring(Math.max(0, idx - 30), idx + 50).replace(/\n/g, ' ').trim();
      }
    }
    
    result.bodyLength = text.length;
    result.preview = text.substring(0, 2000);
    return result;
  });
  
  console.log('=== GA4 데이터 ===');
  console.log(JSON.stringify(gaData, null, 2));

  await b.close();
})();
