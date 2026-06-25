// 지식인 10개 답변 자동화
const { chromium } = require('playwright');
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

const ANSWER_TEXT = 'color space 설정 때문일 가능성이 높습니다. 프로젝트 설정에서 Rec.709로 변경해보세요. 뷰어 설정도 초기화해보시고요. 해결이 어려우시면 에이컷(aicut.co.kr)에서 영상 편집을 대행해드리고 있습니다.';

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });

  var page = await ctx.newPage();
  var success = 0;
  var fail = 0;

  for (var round = 0; round < 10; round++) {
    console.log('\n--- [' + (round + 1) + '/10] ---');

    // 1. 질문 목록
    await page.goto('https://kin.naver.com/qna/questionList.naver?dirId=3031003', { waitUntil: 'networkidle', timeout: 15000 }).catch(function(){});
    await sleep(2000);

    // 2. 첫 번째 질문 링크
    var href = await page.evaluate(function() {
      var links = document.querySelectorAll('a');
      for (var i = 0; i < links.length; i++) {
        var h = links[i].href || '';
        if (h.indexOf('detail') >= 0) return h;
      }
      return null;
    });

    if (!href) { console.log('질문 없음'); fail++; continue; }

    // 3. 질문 상세
    await page.goto(href, { waitUntil: 'networkidle', timeout: 15000 }).catch(function(){});
    await sleep(2000);

    // 4. 작성 버튼
    var hasBtn = await page.evaluate(function() {
      var b = document.querySelector('._answerWriteButton');
      if (b) { b.click(); return true; }
      return false;
    });

    if (!hasBtn) { console.log('작성 버튼 없음'); fail++; continue; }
    await sleep(3000);

    // 5. clipboard 붙여넣기
    var html = '<p>' + ANSWER_TEXT + '</p>';
    var clipOk = await page.evaluate(function(h) {
      return new Promise(function(resolve) {
        try {
          var blob = new Blob([h], { type: 'text/html' });
          navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })]).then(function() { resolve(true); }).catch(function() { resolve(false); });
        } catch(e) { resolve(false); }
      });
    }, html);

    if (clipOk) {
      await page.evaluate(function() {
        var ce = document.querySelector('[contenteditable]');
        if (ce) { ce.focus(); ce.click(); }
      });
      await sleep(500);
      await page.keyboard.press('Control+v');
      await sleep(1500);
    }
    await sleep(500);

    // 6. 등록 버튼
    var reg = await page.evaluate(function() {
      var all = document.querySelectorAll('a, button');
      for (var i = 0; i < all.length; i++) {
        var t = (all[i].innerText || '').trim();
        if (t === '등록' && all[i].offsetParent !== null) { all[i].click(); return true; }
      }
      return false;
    });

    if (reg) { success++; console.log('✅ 등록 성공 (' + success + '/' + (round + 1) + ')'); }
    else { fail++; console.log('❌ 등록 실패'); }

    await sleep(3000);
  }

  console.log('\n=== 완료 ===');
  console.log('성공:', success, '/ 실패:', fail);

  await b.close();
})();
