const { chromium } = require('playwright');
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  var b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  var page = b.contexts()[0].pages()[0];
  
  // 1번 질문 상세 확인
  console.log('[1/2] AI동영상 편집 질문 확인중...');
  await page.goto('https://search.naver.com/search.naver?query=' + encodeURIComponent('Ai동영상 편집') + '&where=kin', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(function(){});
  await sleep(3000);
  
  // 첫 번째 질문 링크 클릭
  var clicked = await page.evaluate(function() {
    var links = document.querySelectorAll('a[href*=\"kin.naver.com/qna\"]');
    for (var i = 0; i < links.length; i++) {
      var t = (links[i].innerText || '').trim();
      // AI동영상 관련 질문 찾기
      if (t.indexOf('AI') >= 0 || t.indexOf('ai') >= 0 || t.indexOf('동영상') >= 0) {
        links[i].click();
        return true;
      }
    }
    return false;
  });
  console.log('링크 클릭:', clicked);
  await sleep(4000);
  
  // 질문 내용 확인
  var qInfo = await page.evaluate(function() {
    return (document.body.innerText || '').substring(0, 800);
  });
  console.log('질문 내용:', qInfo.substring(0, 400));
  
  await page.screenshot({ path: 'C:/Users/paul/.openclaw/workspace/kin_q1.png' }).catch(function(){});
  console.log('스크린샷 저장');
  
  // 답변 등록 - 답변 에디터가 있는지 확인
  var hasEditor = await page.evaluate(function() {
    var ta = document.querySelectorAll('textarea, [contenteditable], [role=textbox]');
    return ta.length;
  });
  console.log('답변 에디터:', hasEditor > 0 ? '있음' : '없음 (답변하기 버튼 필요)');
  
  await b.close();
})();
