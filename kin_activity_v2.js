const { chromium } = require('playwright');
const CDP_PORT = 9224;
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

const QUERIES = ['영상편집 외주', '숏폼 제작', '영상편집 업체', '릴스 편집'];
const ANSWER = '안녕하세요, 영상 편집 아웃소싱 전문 에이컷(AICUT)입니다.\n\n영상 편집 제작 관련해서 도움이 필요하시면 언제든 문의 주세요.\n저희는 월 정기로 숏폼/릴스/유튜브 영상을 편집해 드리고 있습니다.\n\n자세한 내용은 블로그에서 확인하실 수 있습니다.\nhttps://blog.naver.com/aicut';

(async () => {
  console.log('=== 네이버 지식iN 답변 활동 시작 ===\n');
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  var success = 0;

  for (var i = 0; i < QUERIES.length; i++) {
    var q = QUERIES[i];
    console.log('[' + (i+1) + '/4] "' + q + '" 검색...');

    // 검색
    await page.goto('https://kin.naver.com/search/list.naver?query=' + encodeURIComponent(q), { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(function(e){});
    await sleep(3000);

    // 질문 링크 찾기
    var links = await page.evaluate(function() {
      var all = Array.from(document.querySelectorAll('a'));
      return all.filter(function(l) { return l.href && l.href.includes('/qna/detail'); }).slice(0, 3).map(function(l) {
        return { text: (l.innerText || '').trim().substring(0, 50), href: l.href };
      });
    });

    if (links.length === 0) {
      console.log('   ❌ 질문 없음');
      continue;
    }

    var target = links[0];
    console.log('   질문:', target.text.substring(0, 40));

    // 질문 페이지 이동
    await page.goto(target.href, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(function(e){});
    await sleep(3000);

    // 답변하기 버튼 찾기
    var btnResult = await page.evaluate(function() {
      var btns = Array.from(document.querySelectorAll('button, a, span'));
      for (var i = 0; i < btns.length; i++) {
        var t = (btns[i].innerText || '').trim();
        if (t === '답변하기' || t === '이 질문에 답변하기' || t.includes('답변')) {
          if (btns[i].offsetParent !== null && btns[i].tagName === 'BUTTON') {
            btns[i].click(); return 'clicked_button';
          }
        }
      }
      return 'not_found';
    });
    console.log('   답변 버튼:', btnResult);
    await sleep(3000);

    // 에디터 찾기
    var inputDone = await page.evaluate(function(text) {
      // contenteditable 찾기
      var ce = document.querySelector('[contenteditable="true"]');
      if (ce) {
        ce.focus();
        ce.innerText = text;
        ce.dispatchEvent(new Event('input', { bubbles: true }));
        return 'contenteditable_ok';
      }
      // textarea 찾기
      var ta = document.querySelector('textarea');
      if (ta && ta.offsetParent !== null) {
        ta.value = text;
        ta.dispatchEvent(new Event('input', { bubbles: true }));
        return 'textarea_ok';
      }
      return 'none';
    }, ANSWER);
    console.log('   입력:', inputDone);
    await sleep(2000);

    // 등록 버튼
    var submitResult = await page.evaluate(function() {
      var btns = Array.from(document.querySelectorAll('button, a'));
      for (var i = 0; i < btns.length; i++) {
        var t = (btns[i].innerText || '').trim();
        if ((t === '등록' || t === '답변등록' || t.includes('등록')) && btns[i].offsetParent !== null && !btns[i].disabled) {
          btns[i].click(); return 'clicked';
        }
      }
      return 'not_found';
    });
    console.log('   등록:', submitResult);

    if (submitResult === 'clicked') {
      success++;
      console.log('   ✅ [' + (i+1) + '/4] 답변 완료!');
    } else {
      console.log('   ❌ 등록 실패');
    }

    // 10분 대기 (마지막 제외)
    if (i < QUERIES.length - 1) {
      console.log('\n   ⏰ 10분 대기... (' + new Date(Date.now() + 600000).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) + ')');
      await sleep(600000);
    }
  }

  console.log('\n=== 최종 결과 ===');
  console.log(success + '/' + QUERIES.length + '건 답변 완료');
  await b.close();
})();
