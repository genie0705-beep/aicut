// 지식iN SmartEditor 분석
const { chromium } = require('playwright');
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });

  var page = await ctx.newPage();
  await page.goto('https://kin.naver.com/qna/questionList.naver', { waitUntil: 'networkidle', timeout: 15000 }).catch(function(){});
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

  var info = await page.evaluate(function() {
    var r = {};
    try {
      r.editorKeys = Object.keys(SmartEditor._editors);
    } catch(e) { r.smartError = e.message; }
    r.textareas = document.querySelectorAll('textarea').length;
    r.editables = document.querySelectorAll('[contenteditable]').length;
    r.body = document.body.innerText.substring(0, 500);
    return r;
  });

  console.log(JSON.stringify(info, null, 2));

  // textarea가 있으면 직접 채우기
  if (info.textareas > 0) {
    await page.evaluate(function() {
      var ta = document.querySelector('textarea');
      if (ta) {
        ta.value = '테스트 답변입니다. 에이컷(aicut.co.kr)에서 영상 편집 아웃소싱 서비스를 제공합니다.';
        ta.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    console.log('textarea 입력 완료');
    await sleep(500);

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
    console.log('등록:', reg);
    await sleep(3000);
  }

  console.log('\n✅ 완료 URL:', page.url().substring(0, 120));

  await b.close();
})();
