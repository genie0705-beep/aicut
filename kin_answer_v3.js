const { chromium } = require('playwright');
const CDP_PORT = 9224;
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

const ANSWER_TEXT = '안녕하세요, 영상 편집 아웃소싱 전문 에이컷(AICUT)입니다.\n영상 편집 관련해서 도움이 필요하시면 블로그를 참고해주세요.\nhttps://blog.naver.com/aicut';

const QUERIES = ['영상편집 외주', '숏폼 제작', '영상편집 업체', '릴스 편집'];

(async () => {
  console.log('=== 지식iN 답변 시작 ===\n');
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  var success = 0;

  for (var i = 0; i < QUERIES.length; i++) {
    var q = QUERIES[i];
    console.log('[' + (i+1) + '/4] "' + q + '" 검색');
    
    await page.goto('https://kin.naver.com/search/list.naver?query=' + encodeURIComponent(q), { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(function(e){});
    await sleep(3000);

    // 검색 결과에서 질문 링크 수집 (답변 0개인 것 우선)
    var questions = await page.evaluate(function() {
      var items = document.querySelectorAll('.search-result-item, .total_wrap, [class*=\"total\"], [class*=\"list\"]');
      var links = Array.from(document.querySelectorAll('a[href*=\"/qna/detail\"]'));
      var unique = [];
      var seen = {};
      links.forEach(function(l) {
        var h = l.href;
        if (!seen[h]) { seen[h] = true; unique.push({ text: (l.innerText || '').trim().substring(0, 40), href: h }); }
      });
      return unique.slice(0, 3);
    });

    console.log('   질문:', questions.length + '개');
    if (questions.length === 0) {
      console.log('   ❌ 스킵');
      continue;
    }

    var target = questions[0];
    console.log('   선택:', target.text.substring(0, 35));

    await page.goto(target.href, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(function(e){});
    await sleep(3000);

    // "답변" 버튼 클릭 (class 기반)
    var clickResult = await page.evaluate(function() {
      var btns = document.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        var cls = btns[i].className || '';
        var txt = (btns[i].innerText || '').trim();
        if (cls.includes('_answerWriteBu') || txt === '답변') {
          if (btns[i].offsetParent !== null) {
            btns[i].click();
            return 'clicked_class: ' + cls.substring(0, 30) + ' / text: ' + txt;
          }
        }
      }
      return 'not_found';
    });
    console.log('   답변 버튼:', clickResult);
    await sleep(3000);

    // 에디터 찾기 (iframe, contenteditable, textarea 순)
    var inputDone = false;

    // 1) iframe 내 contenteditable
    var frames = await page.$$('iframe');
    for (var f = 0; f < frames.length; f++) {
      try {
        var frame = await frames[f].contentFrame();
        if (frame) {
          var ce = await frame.$('[contenteditable]');
          if (ce) {
            await ce.click({ force: true });
            await sleep(500);
            await ce.evaluate(function(el, text) { el.innerText = text; el.dispatchEvent(new Event('input', {bubbles:true})); }, ANSWER_TEXT);
            console.log('   ✅ iframe > contenteditable 입력');
            inputDone = true;
            break;
          }
        }
      } catch(e) {}
    }

    // 2) 직접 contenteditable
    if (!inputDone) {
      var ceResult = await page.evaluate(function(text) {
        var ce = document.querySelector('[contenteditable="true"]');
        if (ce && ce.offsetParent !== null) {
          ce.focus();
          ce.innerText = text;
          ce.dispatchEvent(new Event('input', {bubbles:true}));
          ce.dispatchEvent(new Event('change', {bubbles:true}));
          return true;
        }
        return false;
      }, ANSWER_TEXT);
      if (ceResult) { console.log('   ✅ contenteditable 직접 입력'); inputDone = true; }
    }

    // 3) textarea
    if (!inputDone) {
      var taResult = await page.evaluate(function(text) {
        var ta = document.querySelector('textarea');
        if (ta && ta.offsetParent !== null) {
          ta.value = text;
          ta.dispatchEvent(new Event('input', {bubbles:true}));
          return true;
        }
        return false;
      }, ANSWER_TEXT);
      if (taResult) { console.log('   ✅ textarea 입력'); inputDone = true; }
    }

    if (!inputDone) {
      console.log('   ❌ 입력창 못 찾음');
      // 페이지에 보이는 모든 입력 요소 로그
      var inputs = await page.evaluate(function() {
        var all = document.querySelectorAll('input:not([type=hidden]), textarea, [contenteditable], iframe');
        return Array.from(all).map(function(el) {
          return el.tagName + ' id=' + (el.id || '') + ' visible=' + (el.offsetParent !== null);
        });
      });
      console.log('   입력 요소들:', JSON.stringify(inputs));
    }

    // 등록
    if (inputDone) {
      await sleep(2000);
      var submitResult = await page.evaluate(function() {
        var btns = Array.from(document.querySelectorAll('button'));
        for (var i = 0; i < btns.length; i++) {
          var t = (btns[i].innerText || '').trim();
          if ((t === '등록' || t === '답변등록' || t === '저장') && btns[i].offsetParent !== null && !btns[i].disabled) {
            btns[i].click();
            return 'clicked';
          }
        }
        return 'not_found';
      });
      console.log('   등록:', submitResult);
      if (submitResult === 'clicked') {
        success++;
        console.log('   ✅ [' + (i+1) + '/4] 완료!');
      }
    }

    // 10분 대기
    if (i < QUERIES.length - 1) {
      console.log('\n   ⏰ 10분 대기...');
      await sleep(600000);
    }
  }

  console.log('\n=== 최종: ' + success + '/' + QUERIES.length + '건 완료 ===');
  await b.close();
})();
