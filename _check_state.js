// 페이지 상태 확인
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });
  var pages = ctx.pages();
  var pwPage = null;
  for (var i = 0; i < pages.length; i++) {
    if (pages[i].url().indexOf('PostWriteForm') >= 0) { pwPage = pages[i]; break; }
  }
  if (!pwPage) { await b.close(); return; }
  
  await pwPage.bringToFront();
  await new Promise(function(r) { setTimeout(r, 3000); });
  
  var r = await pwPage.evaluate(function() {
    var result = {};
    
    // visible modals/popups
    result.modalCount = 0;
    result.modalTexts = [];
    var allDivs = document.querySelectorAll('div');
    for (var i = 0; i < allDivs.length; i++) {
      var d = allDivs[i];
      if (d.offsetParent !== null) {
        var t = (d.innerText || '').trim();
        if (t.indexOf('발행') >= 0 && t.length < 30 && t.indexOf('발행하') >= 0) {
          result.modalCount++;
          result.modalTexts.push({ cls: (d.className||'').substring(0,60), text: t });
        }
      }
    }
    
    // buttons
    result.buttons = [];
    var btns = document.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      if (btns[i].offsetParent !== null) {
        var t = (btns[i].innerText || '').trim();
        if (t === '발행' || t === '저장' || t.indexOf('발행') >= 0 || t.indexOf('확인') >= 0 || t.indexOf('취소') >= 0) {
          result.buttons.push(t);
        }
      }
    }
    
    // content
    try {
      var ed = SmartEditor._editors['blogpc001'];
      result.contentLen = ed.getContentText ? ed.getContentText().length : 0;
    } catch(e) {}
    
    // title
    var titleEl = document.querySelector('.se-documentTitle');
    result.title = titleEl ? (titleEl.innerText || '').substring(0, 50) : 'none';
    
    return result;
  });
  
  console.log(JSON.stringify(r, null, 2));
  
  await b.close();
})();
