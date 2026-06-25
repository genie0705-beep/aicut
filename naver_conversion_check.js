const { chromium } = require('playwright');
const CDP_PORT = 9224;
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  console.log('=== 전환추적 상태 확인 및 조치 ===\n');
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  // 1. 전환추적 페이지 이동
  console.log('1. 전환추적 페이지 이동...');
  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/tool/analytics', { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(3000);
  console.log('   URL:', page.url().substring(0, 90));

  // 2. 현재 상태 확인
  var statusText = await page.evaluate(function() {
    var text = document.body.innerText || '';
    return text.substring(0, 2000);
  });
  console.log('=== 페이지 내용 ===');
  console.log(statusText.substring(0, 1500));

  // 3. "네이버 전환 스크립트 어시스턴트" 링크 찾기
  console.log('\n2. 전환 스크립트 어시스턴트 찾기...');
  var assistantLinks = await page.evaluate(function() {
    var links = Array.from(document.querySelectorAll('a'));
    return links.filter(function(l) {
      var t = l.innerText || '';
      return t.includes('스크립트') || t.includes('어시스턴트') || t.includes('바로가기');
    }).map(function(l) {
      return { text: l.innerText.trim().substring(0, 50), href: l.href.substring(0, 120) };
    });
  });
  console.log('   관련 링크:', JSON.stringify(assistantLinks, null, 2));

  if (assistantLinks.length > 0) {
    console.log('3. 어시스턴트 실행...');
    var targetLink = assistantLinks.find(function(l) { return l.href && (l.href.includes('assistant') || l.href.includes('check')); });
    if (targetLink) {
      await page.goto(targetLink.href, { waitUntil: 'networkidle', timeout: 30000 });
      await sleep(3000);
      var assistResult = await page.evaluate(function() {
        return (document.body.innerText || '').substring(0, 2000);
      });
      console.log('   어시스턴트 결과:', assistResult.substring(0, 1000));
    }
  }

  // 4. 1:1 문의 페이지 찾기
  console.log('\n4. 1:1 문의 채널 찾기...');
  var helpLinks = await page.evaluate(function() {
    var links = Array.from(document.querySelectorAll('a'));
    return links.filter(function(l) {
      var t = l.innerText || '';
      return t.includes('문의') || t.includes('상담') || t.includes('고객센터') || t.includes('컨설팅');
    }).map(function(l) {
      return { text: l.innerText.trim().substring(0, 40), href: l.href.substring(0, 120) };
    });
  });
  console.log('   문의/상담 링크:', JSON.stringify(helpLinks, null, 2));

  await b.close();
  console.log('\n✅ 확인 완료');
})();
