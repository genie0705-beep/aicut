// 모바일 지식iN 답변 1개
const { chromium } = require('playwright');
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });

  var page = await ctx.newPage();

  // 영화편집,효과 분야 질문 목록
  await page.goto('https://m.kin.naver.com/mobile/qna/directoryQuestionList.naver?categoryId=3&dirId=3031003', { waitUntil: 'networkidle', timeout: 15000 }).catch(function(){});
  await sleep(2000);

  // 질문 링크 찾기
  var qLinks = await page.evaluate(function() {
    var r = [];
    var links = document.querySelectorAll('a');
    for (var i = 0; i < links.length; i++) {
      var h = links[i].href || '';
      var t = (links[i].innerText || '').trim();
      if (h.indexOf('detail') >= 0 && t.length > 10) {
        r.push({ title: t.substring(0, 60), href: h });
      }
    }
    return r;
  });

  console.log('질문 수:', qLinks.length);
  if (qLinks.length === 0) { console.log('질문 없음'); await b.close(); return; }

  console.log('첫 질문:', qLinks[0].title);
  await page.goto(qLinks[0].href, { waitUntil: 'networkidle', timeout: 15000 }).catch(function(){});
  await sleep(2000);
  console.log('URL:', page.url().substring(0, 120));

  var qText = await page.evaluate(function() { return document.body.innerText.substring(0, 500); });
  console.log('질문:', qText);

  // 답변 영역 확인
  var info = await page.evaluate(function() {
    var r = {};
    r.textareas = document.querySelectorAll('textarea').length;
    r.editables = document.querySelectorAll('[contenteditable]').length;
    r.buttons = [];
    document.querySelectorAll('button').forEach(function(b) {
      if (b.offsetParent !== null) r.buttons.push((b.innerText || '').trim());
    });
    return r;
  });
  console.log('에디터:', JSON.stringify(info));

  // 답변 텍스트
  var answer = '안녕하세요. 영상 편집의 경우 프리미어 프로(유료)나 다빈치 리졸브(무료)를 가장 많이 사용합니다. 컷편집/자막/색보정 모두 무료로 가능하니 다빈치 리졸브부터 시작해보세요. 시간이 부족하시다면 저희 에이컷(aicut.co.kr)에서 편집을 대행해드리고 있습니다.';

  if (info.textareas > 0) {
    await page.evaluate(function(text) {
      var ta = document.querySelector('textarea');
      if (ta) { ta.value = text; ta.dispatchEvent(new Event('input', { bubbles: true })); }
    }, answer);
    console.log('textarea ✅');
    await sleep(500);
  } else if (info.editables > 0) {
    await page.evaluate(function(text) {
      var el = document.querySelector('[contenteditable]');
      if (el) { el.innerText = text; el.dispatchEvent(new Event('input', { bubbles: true })); }
    }, answer);
    console.log('contenteditable ✅');
    await sleep(500);
  }

  // 등록 버튼
  var reg = await page.evaluate(function() {
    var all = document.querySelectorAll('button, a');
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
  var done = await page.evaluate(function() { return document.body.innerText.substring(0, 300); });
  console.log('완료:', done.substring(0, 200));

  await b.close();
})();
