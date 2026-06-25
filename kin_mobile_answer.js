const { chromium } = require('playwright');
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

var TASKS = [
  {
    keyword: '숏폼',
    answer: '숏폼 콘텐츠 제작 업체 알아보고 계시는군요.\n\n저는 에이컷(aicut.co.kr)이라는 서비스를 이용 중인데요. 월 정액으로 숏폼을 정기 납품받을 수 있어서 건당 계약보다 부담이 적습니다. AI 에디터가 기본 편집 + 전담 에디터가 최종 검수하는 방식이라 퀄리티도 괜찮아요.\n\n무료 샘플도 가능하니까 한번 문의해보세요!'
  },
  {
    keyword: 'AI 영상편집 프로그램',
    answer: 'AI 영상편집 프로그램 추천드립니다.\n\n1. CapCut - 초보자 최적, AI 자막/자동 편집\n2. Vrew - 음성인식 자막 강점\n3. Runway - 고급 AI 영상 생성\n\n다만 AI만으로 완성도 높은 편집은 어렵습니다. 브랜드 톤이나 감각적인 편집은 전문가의 손길이 필요해요.\n\n그런 점에서 저는 AI가 1차 편집 + 전담 에디터 검수하는 에이컷(aicut.co.kr)을 사용 중입니다. 시간도 절약되고 퀄리티도 만족스러워요. 참고하세요!'
  }
];

async function findQuestion(page, keyword) {
  await page.goto('https://m.kin.naver.com/mobile/search/search.naver?query=' + encodeURIComponent(keyword), { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(function(){});
  await sleep(3000);
  
  var result = await page.evaluate(function(kw) {
    var links = document.querySelectorAll('a[href*="detail.naver"]');
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href') || '';
      // 전체 URL 구성
      var fullHref = href.indexOf('http') >= 0 ? href : 'https://m.kin.naver.com' + href;
      var title = (links[i].innerText || '').trim();
      if (title.length > 10 && title.indexOf(kw) >= 0) {
        return { title: title.substring(0, 50), href: fullHref };
      }
    }
    return null;
  }, keyword);
  
  return result;
}

async function answerOnMobile(page, question, answerText) {
  // 질문 페이지로 이동
  await page.goto(question.href, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(function(){});
  await sleep(3000);
  
  // 에디터 확인
  var editor = await page.evaluate(function() {
    var ta = document.querySelectorAll('textarea');
    var ce = document.querySelectorAll('[contenteditable]');
    var btns = [];
    document.querySelectorAll('button').forEach(function(b) {
      if (b.offsetParent !== null) btns.push((b.innerText || '').trim().substring(0, 10));
    });
    return { textarea: ta.length, ce: ce.length, buttons: btns };
  });
  
  console.log('  에디터:', 'textarea=' + editor.textarea + ' ce=' + editor.ce);
  console.log('  버튼:', JSON.stringify(editor.buttons));
  
  var typed = false;
  
  if (editor.textarea > 0) {
    var el = await page.$('textarea');
    if (el) {
      await el.click({ force: true });
      await sleep(500);
      await page.keyboard.type(answerText, { delay: 8 });
      typed = true;
      console.log('  textarea 입력 완료');
    }
  } else if (editor.ce > 0) {
    var el = await page.$('[contenteditable]');
    if (el) {
      await el.click({ force: true });
      await sleep(500);
      await page.keyboard.type(answerText, { delay: 8 });
      typed = true;
      console.log('  contenteditable 입력 완료');
    }
  } else {
    // 화면 스크롤해서 숨겨진 에디터 찾기
    await page.evaluate(function() { window.scrollTo(0, document.body.scrollHeight); });
    await sleep(1000);
    
    var editor2 = await page.evaluate(function() {
      return { ta: document.querySelectorAll('textarea').length, ce: document.querySelectorAll('[contenteditable]').length };
    });
    console.log('  스크롤 후:', JSON.stringify(editor2));
    
    if (editor2.ta > 0) {
      var el = await page.$('textarea');
      if (el) { await el.click({ force: true }); await sleep(500); await page.keyboard.type(answerText, { delay: 8 }); typed = true; console.log('  textarea 입력 완료'); }
    }
  }
  
  if (typed) {
    await sleep(1000);
    
    // 등록 버튼
    var registered = await page.evaluate(function() {
      var btns = document.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        var t = (btns[i].innerText || '').trim();
        if ((t === '등록' || t === '답변등록' || t === '저장' || t.indexOf('등록') >= 0) && btns[i].offsetParent !== null && !btns[i].disabled) {
          btns[i].click();
          return true;
        }
      }
      return false;
    });
    console.log('  등록:', registered ? '클릭!' : '못찾음');
    await sleep(3000);
    
    // 확인
    var afterText = await page.evaluate(function() { return (document.body.innerText || '').substring(0, 200); });
    console.log('  등록 후:', afterText.substring(0, 100));
  } else {
    console.log('  ⚠️ 에디터 못찾음');
  }
}

(async () => {
  var b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  var ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });
  var page = ctx.pages()[0];
  
  // 모바일 페이지로 이동
  await page.goto('https://m.kin.naver.com/', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(function(){});
  await sleep(2000);
  
  for (var i = 0; i < TASKS.length; i++) {
    console.log('\n[' + (i+1) + '/' + TASKS.length + '] ' + TASKS[i].keyword);
    
    var q = await findQuestion(page, TASKS[i].keyword);
    if (q) {
      console.log('  질문:', q.title.substring(0, 40));
      await answerOnMobile(page, q, TASKS[i].answer);
    } else {
      console.log('  질문 못찾음');
      // 검색 결과 페이지 내용 확인
      var text = await page.evaluate(function() { return (document.body.innerText || '').substring(0, 500); });
      console.log('  페이지:', text.substring(0, 200));
    }
    
    if (i < TASKS.length - 1) {
      console.log('\n  30초 대기...');
      await sleep(30000);
    }
  }
  
  console.log('\n완료!');
  await b.close();
})();
