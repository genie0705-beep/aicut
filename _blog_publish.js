// 블로그 발행 스크립트
const { chromium } = require('playwright');

function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });
  
  var pages = ctx.pages();
  var pwPage = null;
  for (var i = 0; i < pages.length; i++) {
    if (pages[i].url().indexOf('PostWriteForm') >= 0) { pwPage = pages[i]; break; }
  }
  if (!pwPage) { console.log('no page'); await b.close(); return; }
  
  await pwPage.bringToFront();
  await sleep(3000);
  
  var st = await pwPage.evaluate(function() {
    try {
      var ed = SmartEditor._editors['blogpc001'];
      return { contentLen: ed.getContentText ? ed.getContentText().length : 0 };
    } catch(e) { return { error: e.message }; }
  });
  console.log('컨텐츠 길이:', st.contentLen);
  
  // 제목 재설정
  await pwPage.evaluate(function() {
    SmartEditor._editors['blogpc001'].setDocumentTitle('온라인 강의·교육 콘텐츠 창작자라면 영상 편집 아웃소싱이 필요한 이유');
  });
  await sleep(1000);
  
  // 발행 버튼 클릭
  var pubClicked = await pwPage.evaluate(function() {
    var btns = document.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      var t = (btns[i].innerText || '').trim();
      if (t === '발행' && btns[i].offsetParent !== null) {
        btns[i].click();
        return true;
      }
    }
    return false;
  });
  console.log('발행 클릭:', pubClicked);
  
  await sleep(5000);
  
  // 발행 후 URL 확인
  var curUrl = pwPage.url();
  console.log('현재 URL:', curUrl);
  
  // '발행' 후 다이얼로그 또는 확인 버튼 처리
  // 발행 설정 모달이 나타나면 '발행하기' 버튼 클릭
  var confirmPub = await pwPage.evaluate(function() {
    var btns = document.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      var t = (btns[i].innerText || '').trim();
      if ((t === '발행하기' || t === '확인') && btns[i].offsetParent !== null) {
        btns[i].click();
        return true;
      }
    }
    return false;
  });
  
  if (confirmPub) {
    console.log('발행 확인 클릭');
    await sleep(5000);
    console.log('발행 후 URL:', pwPage.url().substring(0, 120));
  }
  
  await b.close();
})();
