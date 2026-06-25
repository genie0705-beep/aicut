const { chromium } = require('playwright');
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

var TARGET_QS = [
  { keyword: '숏폼 영상 제작', titleMatch: '숏폼 콘텐츠 제작' },
  { keyword: '영상편집 프로그램 추천', titleMatch: 'AI' }
];

async function checkAndAnswer(page, kw, match) {
  await page.goto('https://search.naver.com/search.naver?query=' + encodeURIComponent(kw) + '&where=kin', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(function(){});
  await sleep(3000);
  
  var qs = await page.evaluate(function(m) {
    var links = document.querySelectorAll('a[href*="kin.naver.com/qna/"]');
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href') || '';
      var title = (links[i].innerText || '').trim();
      if (title.indexOf(m) >= 0 && href.indexOf('/qna/detail') >= 0) {
        return { title: title.substring(0, 60), href: href };
      }
    }
    return null;
  }, match);
  
  if (!qs) { console.log('  질문 못찾음'); return false; }
  
  console.log('  질문 발견:', qs.title);
  
  // 질문 페이지로 이동
  await page.goto(qs.href, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(function(){});
  await sleep(4000);
  
  var info = await page.evaluate(function() {
    var text = (document.body.innerText || '').substring(0, 1500);
    var hasAnswerBtn = text.indexOf('답변하기') >= 0;
    // 답변 개수 확인
    var matchResult = text.match(/답변\s*(\d+)개/);
    var answerCount = matchResult ? parseInt(matchResult[1]) : 0;
    return { text: text, hasAnswerBtn: hasAnswerBtn, answerCount: answerCount };
  });
  
  console.log('  답변 수:', info.answerCount + '개');
  console.log('  답변하기:', info.hasAnswerBtn ? '가능' : '불가');
  
  if (info.hasAnswerBtn && info.answerCount < 3) {
    // 답변하기 버튼 클릭
    await page.evaluate(function() {
      var btns = document.querySelectorAll('button, a, [role=button]');
      for (var i = 0; i < btns.length; i++) {
        var t = (btns[i].innerText || '').trim();
        if (t === '답변하기') { btns[i].click(); return; }
      }
    });
    await sleep(3000);
    
    // 에디터 확인
    var editorCheck = await page.evaluate(function() {
      var textareas = document.querySelectorAll('textarea');
      var ce = document.querySelectorAll('[contenteditable]');
      return { textarea: textareas.length, ce: ce.length };
    });
    console.log('  에디터:', 'textarea=' + editorCheck.textarea + ' ce=' + editorCheck.ce);
  }
  
  return true;
}

(async () => {
  var b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  var page = b.contexts()[0].pages()[0];
  
  for (var i = 0; i < TARGET_QS.length; i++) {
    console.log('[' + (i+1) + '/2] ' + TARGET_QS[i].keyword);
    var ok = await checkAndAnswer(page, TARGET_QS[i].keyword, TARGET_QS[i].titleMatch);
    if (i < TARGET_QS.length - 1) {
      console.log('  10분 대기...');
      await sleep(10000); // 실제로는 10분, 테스트용 10초
    }
  }
  
  console.log('\n완료');
  await b.close();
})();
