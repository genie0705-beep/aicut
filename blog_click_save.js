const { chromium } = require('playwright');

async function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];

  let page = null;
  for (const pg of ctx.pages()) {
    if (pg.url().includes('Redirect=Write') || pg.url().includes('PostWriteForm')) {
      page = pg;
      break;
    }
  }
  if (!page) { console.log('no page'); await b.close(); return; }
  await page.bringToFront();
  await sleep(2000);

  // Find Frame 1 (PostWriteForm) with the editor content
  var editorFrame = null;
  for (const f of page.frames()) {
    try {
      var text = await f.evaluate(function() { return (document.body.innerText || '').substring(0, 30); });
      if (text && text.indexOf('온라인 강의') >= 0) {
        editorFrame = f;
        console.log('✅ 에디터 프레임 발견');
        break;
      }
    } catch(e) {}
  }

  if (!editorFrame) {
    console.log('에디터 프레임 없음');
    await b.close();
    return;
  }

  // Find and click 저장 button
  console.log('🔍 저장 버튼 검색...');
  
  var saveResult = await editorFrame.evaluate(function() {
    var btns = document.querySelectorAll('button');
    var results = [];
    for (var i = 0; i < btns.length; i++) {
      var t = (btns[i].innerText || '').trim();
      var v = btns[i].offsetParent !== null;
      if (t) results.push({ text: t.substring(0, 10), visible: v, idx: i });
      if (t === '저장' && v) {
        btns[i].click();
        return { clicked: true, text: '저장' };
      }
    }
    return { clicked: false, all: results.slice(0, 30) };
  });
  
  console.log('결과:', JSON.stringify(saveResult, null, 2));

  if (!saveResult.clicked) {
    // Maybe buttons are in a child iframe or the top frame
    console.log('\n메인페이지 버튼 검색...');
    var mainBtns = await editorFrame.evaluate(function() {
      try {
        // Check parent frame
        var parentWin = window.parent;
        if (parentWin) {
          var btns = parentWin.document.querySelectorAll('button');
          var results = [];
          btns.forEach(function(b) {
            var t = (b.innerText || '').trim();
            if (t) results.push({ text: t.substring(0, 10), visible: b.offsetParent !== null });
          });
          return results.slice(0, 30);
        }
      } catch(e) {
        return [{ error: e.message.substring(0, 50) }];
      }
    });
    console.log('  ', JSON.stringify(mainBtns));
  }

  await sleep(2000);
  console.log('\n✅ 완료');
  await b.close();
})();
