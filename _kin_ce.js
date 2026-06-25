// 지식iN 최종 - contentEditable 직접 입력 + 등록
const { chromium } = require('playwright');
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });

  var page = await ctx.newPage();

  // 질문 목록
  await page.goto('https://kin.naver.com/qna/questionList.naver?dirId=3031003', { waitUntil: 'networkidle', timeout: 15000 }).catch(function(){});
  await sleep(2000);

  var href = await page.evaluate(function() {
    var links = document.querySelectorAll('a');
    for (var i = 0; i < links.length; i++) {
      var h = links[i].href || '';
      if (h.indexOf('detail') >= 0) return h;
    }
    return null;
  });
  if (!href) { await b.close(); return; }

  await page.goto(href, { waitUntil: 'networkidle', timeout: 15000 }).catch(function(){});
  await sleep(2000);

  // 작성 버튼
  await page.evaluate(function() {
    var b = document.querySelector('._answerWriteButton');
    if (b) b.click();
  });
  await sleep(3000);

  // contentEditable div에 직접 텍스트 입력
  var answer = '영상 편집 시 검정색이 진하게 나오는 문제는 color space 설정 때문일 가능성이 높습니다. 프로젝트 색공간을 Rec.709로 설정하고 뷰어 설정도 초기화해보세요. 그래도 해결이 안 되시면 저희 에이컷(aicut.co.kr)에서 영상 편집을 대행해드리고 있으니 참고하세요!';

  var inputResult = await page.evaluate(function(text) {
    var ce = document.querySelector('[contenteditable]');
    if (ce) {
      ce.focus();
      ce.innerText = text;
      ce.dispatchEvent(new Event('input', { bubbles: true }));
      return 'contenteditable';
    }
    return 'not found';
  }, answer);
  console.log('1. 입력:', inputResult);
  await sleep(1000);

  // 등록 버튼 (저장이 아닌 등록 우선)
  var regResult = await page.evaluate(function() {
    var all = document.querySelectorAll('a, button');
    // '등록' 먼저 찾기
    for (var i = 0; i < all.length; i++) {
      var t = (all[i].innerText || '').trim();
      if ((t === '등록' || t === '답변 등록') && all[i].offsetParent !== null) {
        all[i].click();
        return { text: t };
      }
    }
    // '저장'으로 폴백
    for (var i = 0; i < all.length; i++) {
      var t = (all[i].innerText || '').trim();
      if (t === '저장' && all[i].offsetParent !== null) {
        all[i].click();
        return { text: t };
      }
    }
    return null;
  });
  console.log('2. 등록:', JSON.stringify(regResult));
  await sleep(3000);

  // 결과 확인
  var fullText = await page.evaluate(function() { return document.body.innerText; });
  
  // 계정명(첫 번째) 제외하고 aicut 또는 에이컷 검색
  var acutIdx = fullText.indexOf('aicut.co.kr');
  if (acutIdx >= 0) {
    console.log('3. ✅ aicut.co.kr 링크 발견 (답변 등록 확인!)');
  } else {
    // 두 번째 '에이컷' 찾기
    var first = fullText.indexOf('에이컷');
    var second = fullText.indexOf('에이컷', first + 1);
    if (second >= 0) {
      console.log('3. ✅ 답변 내 에이컷 발견');
    } else {
      console.log('3. ❌ 답변 내 에이컷 미발견');
    }
  }

  console.log('\n📋 질문:', page.url().substring(0, 120));

  await b.close();
})();
