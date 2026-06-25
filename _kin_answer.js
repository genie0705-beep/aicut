// 지식iN 1개 테스트 답변
const { chromium } = require('playwright');
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });

  var page = await ctx.newPage();

  // 답변할 질문 목록 페이지
  await page.goto('https://kin.naver.com/qna/questionList.naver', { waitUntil: 'networkidle', timeout: 15000 }).catch(function(){});
  await sleep(3000);

  // 첫 번째 질문 링크 찾기
  var qHref = await page.evaluate(function() {
    var links = document.querySelectorAll('a');
    for (var i = 0; i < links.length; i++) {
      var h = links[i].href || '';
      var t = (links[i].innerText || '').trim();
      if (h.indexOf('detail') >= 0 && t.length > 10) return h;
    }
    return null;
  });

  if (!qHref) { console.log('질문 없음'); await b.close(); return; }

  console.log('질문 이동:', qHref.substring(0, 100));
  await page.goto(qHref, { waitUntil: 'networkidle', timeout: 15000 }).catch(function(){});
  await sleep(2000);

  // 에디터 분석
  var info = await page.evaluate(function() {
    var r = {};
    r.textareas = document.querySelectorAll('textarea').length;
    r.editables = document.querySelectorAll('[contenteditable]').length;
    try { r.smartEditor = typeof SmartEditor !== 'undefined'; } catch(e) { r.smartEditor = false; }
    return r;
  });
  console.log('에디터:', JSON.stringify(info));

  // 답변 텍스트
  var answer = '안녕하세요. 영상 편집 외주 전문 에이컷(AICUT)입니다. 해당 작업은 전문 업체에 맡기시면 시간과 비용을 절약하실 수 있습니다. 무료 견적은 aicut.co.kr에서 가능합니다.';

  if (info.textareas > 0) {
    await page.evaluate(function(text) {
      var ta = document.querySelector('textarea');
      if (ta) {
        ta.value = text;
        ta.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, answer);
    console.log('textarea 입력 ✅');
  } else if (info.editables > 0) {
    await page.evaluate(function(text) {
      var el = document.querySelector('[contenteditable]');
      if (el) {
        el.innerText = text;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, answer);
    console.log('contenteditable 입력 ✅');
  } else if (info.smartEditor) {
    await page.evaluate(function(text) {
      SmartEditor._editors['kinpc001']._editingService.write(text);
    }, answer);
    console.log('SmartEditor 입력 ✅');
  } else {
    console.log('❌ 에디터 없음');
  }
  await sleep(1000);

  // 등록 버튼
  var reg = await page.evaluate(function() {
    var all = document.querySelectorAll('a, button');
    for (var i = 0; i < all.length; i++) {
      var t = (all[i].innerText || '').trim();
      if (t === '등록' && all[i].offsetParent !== null) {
        all[i].click(); return t;
      }
    }
    return null;
  });
  console.log('등록:', reg || '❌');
  await sleep(3000);

  // 결과
  console.log('\n✅ 완료 URL:', page.url().substring(0, 120));
  var done = await page.evaluate(function() { return document.body.innerText.substring(0, 300); });
  console.log('결과:', done);

  await b.close();
})();
