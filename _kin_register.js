// 지식iN 답변 최종 등록
const { chromium } = require('playwright');
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });

  var page = await ctx.newPage();

  // 영화편집,효과 분야 질문 목록
  await page.goto('https://kin.naver.com/qna/questionList.naver?dirId=3031003', { waitUntil: 'networkidle', timeout: 15000 }).catch(function(){});
  await sleep(2000);

  // 질문 링크
  var links = await page.evaluate(function() {
    var r = [];
    document.querySelectorAll('a').forEach(function(a) {
      var h = a.href || '';
      var t = (a.innerText || '').trim();
      if (h.indexOf('detail') >= 0 && t.length > 10) {
        r.push({ title: t.substring(0, 50), href: h.substring(0, 150) });
      }
    });
    return r;
  });

  if (links.length === 0) { console.log('질문 없음'); await b.close(); return; }

  console.log('선택:', links[0].title);
  await page.goto(links[0].href, { waitUntil: 'networkidle', timeout: 15000 }).catch(function(){});
  await sleep(2000);

  // 1. 답변 작성 버튼 클릭
  var btnClicked = await page.evaluate(function() {
    var btn = document.querySelector('._answerWriteButton');
    if (btn) { btn.click(); return true; }
    return false;
  });
  console.log('1. 작성 버튼:', btnClicked ? '✅' : '❌');
  await sleep(3000);

  // 2. SmartEditor 확인 및 답변 입력
  var edReady = await page.evaluate(function() {
    try {
      var keys = Object.keys(SmartEditor._editors);
      return { ready: keys.length > 0, key: keys[0] };
    } catch(e) {
      // contenteditable 확인
      var ce = document.querySelector('[contenteditable]');
      return { ready: ce !== null, key: 'contenteditable' };
    }
  });
  console.log('2. 에디터:', JSON.stringify(edReady));

  var answer = '파이널컷 프로에서 검정색이 진하게 나오는 문제는 보통 color space 설정 때문일 가능성이 높습니다. 프로젝트 색공간이 Rec.709로 설정되어 있는지 확인해보세요. 뷰어 설정도 초기화해보시고요. 그래도 해결이 안 되시면 저희 에이컷(aicut.co.kr)에서 영상 편집을 대행해드리고 있으니 참고하세요!';

  if (edReady.ready) {
    if (edReady.key === 'contenteditable') {
      await page.evaluate(function(text) {
        var el = document.querySelector('[contenteditable]');
        if (el) { el.innerText = text; el.dispatchEvent(new Event('input', { bubbles: true })); }
      }, answer);
    } else {
      await page.evaluate(function(data) {
        var ed = SmartEditor._editors[data.key];
        if (ed.setDocumentData) ed.setDocumentData(data.text);
        else if (ed.write) ed.write(data.text);
        else if (ed._editingService && ed._editingService.write) ed._editingService.write(data.text);
      }, { key: edReady.key, text: answer });
    }
    console.log('   답변 입력 ✅');
  } else {
    await page.keyboard.type(answer, { delay: 3 });
    console.log('   keyboard 입력 ✅');
  }
  await sleep(1000);

  // 3. 등록 버튼 (저장X, 등록O)
  var regClicked = await page.evaluate(function() {
    var all = document.querySelectorAll('a, button, span');
    // 우선순위: 등록 > 저장
    var priorities = ['등록', '답변 등록', '완료', '저장'];
    for (var p = 0; p < priorities.length; p++) {
      for (var i = 0; i < all.length; i++) {
        var t = (all[i].innerText || '').trim();
        if (t === priorities[p] && all[i].offsetParent !== null) {
          all[i].click();
          return { text: t };
        }
      }
    }
    return null;
  });
  console.log('3. 등록:', JSON.stringify(regClicked));
  await sleep(3000);

  // 4. 결과 확인
  var confirmText = await page.evaluate(function() {
    return document.body.innerText.substring(Math.max(0, document.body.innerText.length - 500));
  });
  console.log('4. 등록 후 메시지:', confirmText);

  // 5. 에이컷 텍스트 재확인 (계정명 제외)
  var fullText = await page.evaluate(function() { return document.body.innerText; });
  var firstIdx = fullText.indexOf('에이컷');
  var secondIdx = fullText.indexOf('에이컷', firstIdx + 1);
  
  if (secondIdx >= 0) {
    var context = fullText.substring(secondIdx, secondIdx + 100);
    console.log('\n✅ 답변 내 에이컷 발견:', context.replace(/\n/g, ' '));
  } else if (fullText.indexOf('aicut') >= 0) {
    console.log('\n✅ aicut.co.kr 링크 발견');
  } else {
    console.log('\n❌ 답변 내 에이컷 미발견');
  }

  console.log('\n📋 질문 URL:', page.url().substring(0, 120));

  await b.close();
})();
