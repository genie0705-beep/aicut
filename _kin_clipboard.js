// 지식iN 최종 - clipboard 방식
const { chromium } = require('playwright');
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });
  var page = await ctx.newPage();

  // 질문 목록
  await page.goto('https://kin.naver.com/qna/questionList.naver?dirId=3031003', { waitUntil: 'networkidle', timeout: 15000 }).catch(function(){});
  await sleep(2000);
  var href = await page.evaluate(function() {
    var links = document.querySelectorAll('a');
    for (var i = 0; i < links.length; i++) {
      var h = links[i].href || '';
      if (h.indexOf('detail') >= 0) return h;
    }
    return null;
  });
  if (!href) { console.log('질문 없음'); await b.close(); return; }
  await page.goto(href, { waitUntil: 'networkidle', timeout: 15000 }).catch(function(){});
  await sleep(2000);

  // 작성 버튼
  await page.evaluate(function() { var b = document.querySelector('._answerWriteButton'); if (b) b.click(); });
  await sleep(3000);

  // clipboard 방식으로 내용 붙여넣기
  var html = '<p>영상 편집 시 검정색이 진하게 나오는 문제는 보통 color space 설정 때문입니다. 프로젝트 설정에서 Rec.709로 변경해보세요. 뷰어 설정도 초기화해보시고요. 해결이 어려우시면 에이컷(aicut.co.kr)에서 영상 편집을 대행해드리고 있습니다.</p>';

  var clipOk = await page.evaluate(function(h) {
    return new Promise(function(resolve) {
      try {
        var blob = new Blob([h], { type: 'text/html' });
        navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })]).then(function() { resolve(true); }).catch(function() { resolve(false); });
      } catch(e) { resolve(false); }
    });
  }, html);

  if (clipOk) {
    // contenteditable div에 포커스 후 Ctrl+V
    await page.evaluate(function() {
      var ce = document.querySelector('[contenteditable]');
      if (ce) { ce.focus(); ce.click(); }
    });
    await sleep(500);
    await page.keyboard.press('Control+v');
    await sleep(2000);
    console.log('clipboard 붙여넣기 ✅');
  } else {
    // keyboard type
    var answerText = '영상 편집 시 검정색이 진하게 나오는 문제는 보통 color space 설정 때문입니다. 프로젝트 설정에서 Rec.709로 변경해보세요. 뷰어 설정도 초기화해보시고요. 해결이 어려우시면 에이컷(aicut.co.kr)에서 영상 편집을 대행해드리고 있습니다.';
    await page.evaluate(function(text) {
      var ce = document.querySelector('[contenteditable]');
      if (ce) { ce.focus(); ce.innerText = text; ce.dispatchEvent(new Event('input', { bubbles: true })); }
    }, answerText);
    console.log('직접 입력 ✅');
  }
  await sleep(1000);

  // 등록 버튼
  var reg = await page.evaluate(function() {
    var all = document.querySelectorAll('a, button');
    for (var i = 0; i < all.length; i++) {
      var t = (all[i].innerText || '').trim();
      if (t === '등록' && all[i].offsetParent !== null) { all[i].click(); return '등록'; }
    }
    for (var i = 0; i < all.length; i++) {
      if ((all[i].innerText || '').trim() === '저장' && all[i].offsetParent !== null) { all[i].click(); return '저장'; }
    }
    return null;
  });
  console.log('등록:', reg);
  await sleep(4000);

  // 결과 - 새로고침 후 확인
  await page.reload({ waitUntil: 'networkidle', timeout: 15000 }).catch(function(){});
  await sleep(2000);

  var fullText = await page.evaluate(function() { return document.body.innerText; });
  var result = {
    hasAicut: fullText.indexOf('aicut.co.kr') >= 0,
    hasEcutInAnswer: fullText.indexOf('aicut.co.kr') >= 0
  };
  console.log('\n✅ 결과:', JSON.stringify(result));

  if (result.hasAicut) {
    console.log('\n✅ 지식iN 답변 등록 성공!');
    console.log('📋 질문:', page.url().substring(0, 120));
  } else {
    console.log('\n❌ 등록 실패');
  }

  await b.close();
})();
