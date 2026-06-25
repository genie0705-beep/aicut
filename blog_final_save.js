const { chromium } = require('playwright');

async function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });

  let page = null;
  for (const pg of ctx.pages()) {
    if (pg.url().includes('blog.naver.com') && pg.url().includes('aicut')) {
      page = pg;
      break;
    }
  }
  if (!page) { console.log('❌ 블로그 페이지 없음 - 새로 열기'); await b.close(); return; }
  
  // Find the write page by navigating
  await page.goto('https://blog.naver.com/aicut?Redirect=Write&', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await sleep(4000);

  // Find mainFrame which contains the editor toolbar and buttons
  var mainFrame = null;
  for (const f of page.frames()) {
    if (f.name() === 'mainFrame') { mainFrame = f; break; }
  }
  
  if (!mainFrame) {
    console.log('❌ mainFrame 찾을 수 없음');
    await b.close();
    return;
  }

  // Check mainFrame for buttons
  var btnInfo = await mainFrame.evaluate(function() {
    var btns = document.querySelectorAll('button');
    var results = [];
    btns.forEach(function(b) {
      var t = (b.innerText || '').trim();
      if (t) results.push({ text: t.substring(0, 15), visible: b.offsetParent !== null });
    });
    return results;
  });
  
  console.log('mainFrame 버튼:', JSON.stringify(btnInfo).substring(0, 500));

  // Find PostWriteForm frame for content input
  var editorFrame = null;
  var inputBuffer = null;
  for (const f of page.frames()) {
    try {
      var url = f.url();
      if (url.indexOf('PostWriteForm') >= 0 && url.indexOf('wtm') < 0) {
        editorFrame = f;
      }
      // Check if body has contenteditable
      var bodyEditable = await f.evaluate(function() {
        try {
          return document.body && document.body.getAttribute('contenteditable') === 'true' ? true : false;
        } catch(e) { return false; }
      });
      if (bodyEditable) { inputBuffer = f; }
    } catch(e) {}
  }

  console.log('editorFrame:', editorFrame ? '✅' : '❌');
  console.log('inputBuffer:', inputBuffer ? '✅' : '❌');

  if (!editorFrame) { console.log('에디터 프레임 없음'); await b.close(); return; }

  // Try SmartEditor API through mainFrame
  var seResult = await mainFrame.evaluate(function() {
    try {
      // Access SmartEditor from the parent frame
      // The SmartEditor object might be on the top window
      var se = window.SmartEditor;
      if (!se) {
        // Try accessing through frames
        try {
          var frames = window.frames;
          for (var i = 0; i < frames.length; i++) {
            if (frames[i].SmartEditor) {
              se = frames[i].SmartEditor;
              break;
            }
          }
        } catch(e) {}
      }
      
      if (se && se._editors) {
        var keys = Object.keys(se._editors);
        return 'SmartEditor found, keys: ' + keys.join(',');
      }
      return 'SmartEditor not accessible from mainFrame';
    } catch(e) {
      return 'error: ' + e.message.substring(0, 60);
    }
  });
  console.log('SE 접근:', seResult);

  await b.close();
})();
