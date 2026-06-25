// 지식iN 답변 완료 - _answerWriteButton 방식
const { chromium } = require('playwright');
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });

  var page = await ctx.newPage();

  // '영화편집,효과' 분야 질문 목록
  await page.goto('https://kin.naver.com/qna/questionList.naver?dirId=3031003', { waitUntil: 'networkidle', timeout: 15000 }).catch(function(){});
  await sleep(2000);

  // 질문 링크 수집
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

  console.log('질문 목록:');
  links.forEach(function(l, i) { console.log('  [' + i + '] ' + l.title); });

  if (links.length === 0) { console.log('질문 없음'); await b.close(); return; }

  // 첫 번째 질문 이동
  console.log('\n선택:', links[0].title);
  await page.goto(links[0].href, { waitUntil: 'networkidle', timeout: 15000 }).catch(function(){});
  await sleep(2000);
  console.log('URL:', page.url().substring(0, 120));

  // 답변 작성 버튼 찾기
  var writeBtn = await page.evaluate(function() {
    // _answerWriteButton 클래스
    var btn = document.querySelector('._answerWriteButton');
    if (btn && btn.offsetParent !== null) {
      btn.click();
      return { found: true, text: (btn.innerText || '').trim(), cls: btn.className.substring(0, 60) };
    }
    // 다른 방식: endAnswerButton
    var btn2 = document.querySelector('.endAnswerButton');
    if (btn2 && btn2.offsetParent !== null) {
      btn2.click();
      return { found: true, text: (btn2.innerText || '').trim() };
    }
    // '답변 작성' 텍스트
    var all = document.querySelectorAll('a, button, span');
    for (var i = 0; i < all.length; i++) {
      var t = (all[i].innerText || '').trim();
      if ((t === '답변 작성' || t.indexOf('답변쓰기') >= 0) && all[i].offsetParent !== null) {
        all[i].click();
        return { found: true, text: t };
      }
    }
    return { found: false };
  });
  console.log('답변 작성 버튼:', JSON.stringify(writeBtn));
  await sleep(3000);

  // 에디터 확인 (SmartEditor iframe 또는 textarea)
  var edCheck = await page.evaluate(function() {
    var r = {};
    // SmartEditor iframe 찾기
    var frames = document.querySelectorAll('iframe');
    r.frames = [];
    frames.forEach(function(f) {
      if (f.id.indexOf('editor') >= 0 || f.id.indexOf('SmartEditor') >= 0 || f.id.indexOf('se2') >= 0) {
        r.frames.push({ id: f.id, src: (f.src||'').substring(0, 80) });
      }
    });
    r.ta = document.querySelectorAll('textarea').length;
    r.ce = document.querySelectorAll('[contenteditable]').length;
    try { r.se = typeof SmartEditor !== 'undefined'; } catch(e) { r.se = false; }
    return r;
  });
  console.log('에디터:', JSON.stringify(edCheck));

  // 답변 작성
  var answer = `파이널컷 프로에서 검정색이 진하게 나오는 문제는 보통 다음 두 가지가 원인입니다.

1. 뷰어 설정 확인: 파이널컷 프로 뷰어의 브라이트니스/컨트라스트 기본값이 변경된 경우 → 환경설정에서 뷰어 리셋
2. color space 설정: 프로젝트 색공간이 Rec.709가 아닌 경우

혹시 해결이 어려우시면 저희 에이컷(aicut.co.kr)에서 영상 편집을 대행해드리고 있으니 편하게 문의주세요!`;

  if (edCheck.ta > 0) {
    await page.evaluate(function(text) {
      var ta = document.querySelector('textarea');
      if (ta) { ta.value = text; ta.dispatchEvent(new Event('input', { bubbles: true })); }
    }, answer);
    console.log('textarea ✅');
  } else if (edCheck.se) {
    await page.evaluate(function(text) {
      var keys = Object.keys(SmartEditor._editors);
      if (keys.length > 0) {
        var ed = SmartEditor._editors[keys[0]];
        if (ed._editingService && ed._editingService.write) {
          ed._editingService.write(text);
        } else if (ed.setDocumentData) {
          ed.setDocumentData(text);
        } else if (ed.write) {
          ed.write(text);
        }
      }
    }, answer);
    console.log('SmartEditor ✅');
  } else {
    // keyboard type
    await page.keyboard.type(answer, { delay: 3 });
    console.log('keyboard ✅');
  }
  await sleep(1000);

  // 등록 버튼
  var reg = await page.evaluate(function() {
    var all = document.querySelectorAll('a, button');
    for (var i = 0; i < all.length; i++) {
      var t = (all[i].innerText || '').trim();
      if ((t === '등록' || t === '저장' || t === '완료') && all[i].offsetParent !== null) {
        all[i].click(); return t;
      }
    }
    return null;
  });
  console.log('등록:', reg || '❌');
  await sleep(3000);

  console.log('\n✅ 최종 URL:', page.url().substring(0, 120));
  var done = await page.evaluate(function() { return document.body.innerText.substring(0, 400); });
  console.log('완료:', done.substring(0, 200));

  await b.close();
})();
