// 지식iN PC 답변 시도 (답변하기 버튼 onclick 분석)
const { chromium } = require('playwright');
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });

  var page = await ctx.newPage();

  // 질문 상세 페이지
  await page.goto('https://kin.naver.com/qna/detail.naver?d1id=3&dirId=3031003&docId=493004243', { waitUntil: 'networkidle', timeout: 15000 }).catch(function(){});
  await sleep(2000);

  // 답변하기 버튼 정보 수집
  var btnData = await page.evaluate(function() {
    var r = {};
    var all = document.querySelectorAll('a');
    for (var i = 0; i < all.length; i++) {
      var t = (all[i].innerText || '').trim();
      if (t === '답변하기') {
        r.href = all[i].href;
        r.onclick = all[i].getAttribute('onclick') || '';
        r.target = all[i].target;
        r.rel = all[i].rel;
        r.className = all[i].className;
        r.innerHTML = all[i].innerHTML.substring(0, 200);
        break;
      }
    }
    return r;
  });
  console.log('답변하기 버튼:', JSON.stringify(btnData, null, 2));

  // href로 이동 (target이면 새 창)
  if (btnData.href) {
    console.log('\n이동:', btnData.href);
    await page.goto(btnData.href, { waitUntil: 'networkidle', timeout: 15000 }).catch(function(){});
    await sleep(3000);
    console.log('이동 후 URL:', page.url().substring(0, 120));

    var afterText = await page.evaluate(function() {
      return document.body.innerText.substring(0, 500);
    });
    console.log('내용:', afterText);

    // textarea/contentEditable 확인
    var ed = await page.evaluate(function() {
      return {
        ta: document.querySelectorAll('textarea').length,
        ce: document.querySelectorAll('[contenteditable]').length
      };
    });
    console.log('에디터:', JSON.stringify(ed));
  }

  await b.close();
})();
