const { chromium } = require('playwright');
const CDP_PORT = 9224;
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

const QUERIES = ['영상편집', '숏폼마케팅', '릴스편집', '영상제작업체'];
const ANSWER_TEMPLATE = `안녕하세요, 영상 편집 아웃소싱 전문 에이컷(AICUT)입니다.

영상 편집 관련해서 도움이 필요하시면 언제든 문의 주세요.
저희는 월 정기로 숏폼/릴스/유튜브 영상을 편집해 드리고 있습니다.

자세한 내용은 블로그에서 확인하실 수 있습니다 🙌
https://blog.naver.com/aicut`;

(async () => {
  console.log('=== 네이버 지식iN 활동 시작 ===\n');
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  var successCount = 0;

  for (var i = 0; i < QUERIES.length; i++) {
    var query = QUERIES[i];
    console.log('[' + (i+1) + '/4] "' + query + '" 검색...');

    // 지식iN 검색
    await page.goto('https://kin.naver.com/search/search.naver?query=' + encodeURIComponent(query), { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(function(e){});
    await sleep(3000);

    // 미답변 질문 찾기
    var qLinks = await page.evaluate(function() {
      var links = Array.from(document.querySelectorAll('a'));
      // 지식iN 질문 링크 패턴
      var qLinks = links.filter(function(l) {
        var h = l.href || '';
        var t = (l.innerText || '').trim();
        return h.includes('kin.naver.com/qna/detail') && t.length > 5;
      });
      return qLinks.slice(0, 5).map(function(l) {
        return { text: (l.innerText || '').trim().substring(0, 50), href: l.href };
      });
    });

    console.log('   질문 후보:', qLinks.length + '개');
    if (qLinks.length === 0) {
      console.log('   건너뜀 (질문 없음)');
      continue;
    }

    // 첫 번째 질문 클릭
    var target = qLinks[0];
    console.log('   선택:', target.text.substring(0, 40));

    await page.goto(target.href, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(function(e){});
    await sleep(3000);

    // 답변 작성 버튼 찾기
    var answerBtn = await page.evaluate(function() {
      var btns = document.querySelectorAll('button, a, span');
      for (var i = 0; i < btns.length; i++) {
        var t = (btns[i].innerText || '').trim();
        if (t === '답변하기' || t === '답변 작성' || t.includes('답변')) {
          if (btns[i].offsetParent !== null) {
            btns[i].click();
            return 'clicked';
          }
        }
      }
      return 'not found';
    });
    console.log('   답변 버튼:', answerBtn);
    await sleep(3000);

    // 에디터 찾기
    var editors = await page.$$('[contenteditable], textarea, iframe');
    console.log('   에디터/iframe:', editors.length);

    if (editors.length > 0) {
      // 텍스트 입력
      for (var e = 0; e < editors.length; e++) {
        try {
          var tag = await editors[e].evaluate(function(el) { return el.tagName; });
          if (tag === 'IFRAME') {
            // iframe 내부 에디터
            var frame = await editors[e].contentFrame();
            if (frame) {
              var ce = await frame.$('[contenteditable]');
              if (ce) {
                await ce.click({ force: true });
                await sleep(500);
                await frame.keyboard.type(ANSWER_TEMPLATE, { delay: 10 });
                console.log('   ✅ iframe 에디터 입력 완료');
                break;
              }
            }
          } else if (tag === 'TEXTAREA') {
            await editors[e].click({ force: true });
            await sleep(500);
            await editors[e].type(ANSWER_TEMPLATE, { delay: 10 });
            console.log('   ✅ textarea 입력 완료');
            break;
          } else if (tag === 'DIV' || tag === 'SPAN') {
            var isEditable = await editors[e].evaluate(function(el) { return el.getAttribute('contenteditable'); });
            if (isEditable) {
              await editors[e].click({ force: true });
              await sleep(500);
              await page.keyboard.type(ANSWER_TEMPLATE, { delay: 10 });
              console.log('   ✅ contenteditable 입력 완료');
              break;
            }
          }
        } catch(e2) {}
      }
    } else {
      console.log('   ❌ 에디터 찾을 수 없음');

      // 대체: 페이지 내에서 입력창 찾기
      var inputResult = await page.evaluate(function(text) {
        var all = document.querySelectorAll('input, textarea, [contenteditable]');
        for (var i = 0; i < all.length; i++) {
          if (all[i].offsetParent !== null) {
            if (all[i].tagName === 'TEXTAREA' || all[i].tagName === 'INPUT') {
              all[i].value = text;
              all[i].dispatchEvent(new Event('input', {bubbles: true}));
              return 'filled_' + all[i].tagName;
            }
          }
        }
        return 'none';
      }, ANSWER_TEMPLATE);
      console.log('   대체 입력:', inputResult);
    }

    await sleep(2000);

    // 등록 버튼
    var submitResult = await page.evaluate(function() {
      var btns = Array.from(document.querySelectorAll('button, a'));
      for (var i = 0; i < btns.length; i++) {
        var t = (btns[i].innerText || '').trim();
        if ((t === '등록' || t === '저장' || t === '답변 등록' || t.includes('등록')) && btns[i].offsetParent !== null && !btns[i].disabled) {
          btns[i].click();
          return 'clicked: ' + t;
        }
      }
      return 'not found';
    });
    console.log('   등록:', submitResult);

    if (submitResult.includes('clicked')) {
      successCount++;
      console.log('   ✅ [' + (i+1) + '/4] 답변 완료!');
    }

    // 10분 간격 대기 (마지막 제외)
    if (i < QUERIES.length - 1) {
      var waitMin = 10;
      console.log('\n   ⏰ ' + waitMin + '분 대기... (' + new Date(Date.now() + waitMin * 60000).toLocaleTimeString('ko-KR', {hour:'2-digit', minute:'2-digit'}) + '에 다음 진행)');
      await sleep(waitMin * 60000);
    }
  }

  console.log('\n=== 완료 ===');
  console.log('총 ' + successCount + '/' + QUERIES.length + '건 답변 완료');
  await b.close();
})();
