const { chromium } = require('playwright');
const CDP_PORT = 9224;
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  console.log('=== GA4 데이터 분석 ===\n');
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  // 이미 열려있는 GA4 페이지 찾기
  var page = null;
  for (var i = 0; i < ctx.pages().length; i++) {
    if (ctx.pages()[i].url().includes('analytics.google.com')) {
      page = ctx.pages()[i];
      console.log('✅ 기존 GA4 페이지 발견:', ctx.pages()[i].url().substring(0, 80));
      break;
    }
  }

  if (!page) {
    console.log('GA4 페이지 없음, 새로 엽니다.');
    page = await ctx.newPage();
    await page.goto('https://analytics.google.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(5000);
  }

  await page.bringToFront();
  await sleep(3000);

  // 속성 ID 확인
  var propInfo = await page.evaluate(function() {
    return {
      url: window.location.href.substring(0, 120),
      title: document.title
    };
  });
  console.log('속성:', propInfo.title, '|', propInfo.url);

  // 1. 홈/인사이트 데이터 추출
  console.log('\n1. 홈 리포트 데이터...');
  var homeData = await page.evaluate(function() {
    var text = document.body.innerText || '';
    
    var result = {};
    var today = new Date().toISOString().substring(0, 10);

    // 지표 검색
    var metrics = ['사용자', '세션', '신규 사용자', '평균 참여 시간', '페이지뷰', '조회수', '전환', '이벤트'];
    for (var i = 0; i < metrics.length; i++) {
      var m = metrics[i];
      var idx = text.indexOf(m);
      if (idx >= 0) {
        result[m] = text.substring(Math.max(0, idx - 20), idx + 40).replace(/\n/g, ' ').trim();
      }
    }

    // 기간 정보
    var dateIdx1 = text.indexOf('2026');
    var dateIdx2 = text.indexOf('2025');
    if (dateIdx1 >= 0 || dateIdx2 >= 0) {
      result.period = text.substring(Math.max(0, Math.min(dateIdx1 >= 0 ? dateIdx1 : 999999, dateIdx2 >= 0 ? dateIdx2 : 999999) - 5), 
        Math.min(text.length, Math.min(dateIdx1 >= 0 ? dateIdx1 : 999999, dateIdx2 >= 0 ? dateIdx2 : 999999) + 30));
    }

    result.bodyPreview = text.substring(0, 3000);
    result.bodyLength = text.length;
    return result;
  });

  console.log('홈 데이터 샘플:', JSON.stringify(homeData, null, 2));

  // 2. 리포트 페이지로 이동 (리얼타임)
  console.log('\n2. 리얼타임 리포트...');
  try {
    await page.goto('https://analytics.google.com/analytics/web/#/p538910436/reports/realtime', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await sleep(5000);

    var rtData = await page.evaluate(function() {
      var text = document.body.innerText || '';
      var result = {};
      var idx = text.indexOf('지금');
      if (idx >= 0) result.now = text.substring(idx, idx + 300).replace(/\n/g, ' ').trim();
      result.preview = text.substring(0, 2000);
      return result;
    });
    console.log('리얼타임:', JSON.stringify(rtData, null, 2));
  } catch(e) {
    console.log('리얼타임 오류:', e.message.substring(0, 50));
  }

  // 3. 획득 보고서 (유입 채널)
  console.log('\n3. 획득 보고서...');
  try {
    await page.goto('https://analytics.google.com/analytics/web/#/p538910436/reports/trafficacquisition', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await sleep(5000);

    var acqData = await page.evaluate(function() {
      var text = document.body.innerText || '';
      var result = {};
      
      var channels = ['Organic Search', 'Paid Search', 'Social', 'Direct', 'Referral', 'Email'];
      for (var i = 0; i < channels.length; i++) {
        var idx = text.indexOf(channels[i]);
        if (idx >= 0) {
          result[channels[i]] = text.substring(idx, idx + 80).replace(/\n/g, ' ').trim();
        }
      }
      
      result.preview = text.substring(0, 1500);
      return result;
    });
    console.log('획득:', JSON.stringify(acqData, null, 2));
  } catch(e) {
    console.log('획득 오류:', e.message.substring(0, 50));
  }

  await b.close();
})();
