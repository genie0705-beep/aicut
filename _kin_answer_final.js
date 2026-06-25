// 모바일 지식iN - 파이널컷 질문에 답변
const { chromium } = require('playwright');
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });

  var page = await ctx.newPage();

  // 모바일 질문 목록
  await page.goto('https://m.kin.naver.com/mobile/qna/directoryQuestionList.naver?dirId=3031003', { waitUntil: 'networkidle', timeout: 15000 }).catch(function(){});
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

  // '파이널컷' 포함된 질문 찾기
  var targetIdx = -1;
  for (var i = 0; i < links.length; i++) {
    if (links[i].title.indexOf('파이널컷') >= 0) { targetIdx = i; break; }
  }

  if (targetIdx < 0) { console.log('파이널컷 질문 없음'); await b.close(); return; }

  console.log('\n선택:', links[targetIdx].title);
  await page.goto(links[targetIdx].href, { waitUntil: 'networkidle', timeout: 15000 }).catch(function(){});
  await sleep(2000);

  console.log('URL:', page.url().substring(0, 120));

  var qText = await page.evaluate(function() {
    return document.body.innerText.substring(0, 500);
  });
  console.log('질문 내용:', qText);

  // 답변 작성 영역 확인
  var editorInfo = await page.evaluate(function() {
    var r = { ta: 0, ce: 0 };
    r.ta = document.querySelectorAll('textarea').length;
    r.ce = document.querySelectorAll('[contenteditable]').length;
    r.btns = [];
    document.querySelectorAll('button').forEach(function(b) {
      if (b.offsetParent !== null) r.btns.push((b.innerText || '').trim().substring(0, 15));
    });
    return r;
  });
  console.log('\n에디터:', JSON.stringify(editorInfo));

  // 답변 작성
  var answer = `파이널컷 프로에서 검정색이 진하게 나오는 문제는 보통 다음 두 가지가 원인입니다.\n\n1. 뷰어 설정: 파이널컷 프로의 뷰어에서 브라이트니스/컨트라스트 기본값이 걸려있는 경우 → 뷰어 설정 리셋\n2. color space 설정: 프로젝트 색공간이 Rec.709 아닌 다른 값으로 설정된 경우\n\n혹시 해결이 어려우시면 저희 에이컷(aicut.co.kr)에서 영상 편집을 대행해드리고 있으니 부담없이 문의주세요!`;

  if (editorInfo.ta > 0) {
    await page.evaluate(function(text) {
      var ta = document.querySelector('textarea');
      if (ta) { ta.value = text; ta.dispatchEvent(new Event('input', { bubbles: true })); }
    }, answer);
    console.log('\ntextarea 입력 ✅');
  } else if (editorInfo.ce > 0) {
    await page.evaluate(function(text) {
      var el = document.querySelector('[contenteditable]');
      if (el) { el.innerText = text; el.dispatchEvent(new Event('input', { bubbles: true })); }
    }, answer);
    console.log('\ncontenteditable 입력 ✅');
  } else {
    console.log('\n⚠️ 에디터 없음 - keyboard type 시도');
    await page.keyboard.type(answer, { delay: 3 });
    console.log('keyboard 입력 ✅');
  }
  await sleep(1000);

  // 등록 버튼
  var reg = await page.evaluate(function() {
    var all = document.querySelectorAll('button, a, span');
    for (var i = 0; i < all.length; i++) {
      var t = (all[i].innerText || '').trim();
      if ((t === '등록' || t === '저장' || t === '완료' || t === '보내기') && all[i].offsetParent !== null) {
        all[i].click(); return t;
      }
    }
    return null;
  });
  console.log('등록:', reg || '❌');
  await sleep(3000);

  console.log('\n✅ 최종 URL:', page.url().substring(0, 120));
  var done = await page.evaluate(function() { return document.body.innerText.substring(0, 400); });
  console.log('완료 메시지:', done);

  await b.close();
})();
