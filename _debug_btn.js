// 사진 버튼 디버그
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  var pages = ctx.pages();
  
  var page = null;
  for (var i = 0; i < pages.length; i++) {
    if (pages[i].url().indexOf('PostWriteForm') >= 0) { page = pages[i]; break; }
  }
  if (!page) { console.log('no page'); await b.close(); return; }
  
  var btnInfo = await page.evaluate(function() {
    var btns = document.querySelectorAll('button');
    var results = [];
    for (var i = 0; i < btns.length; i++) {
      var html = btns[i].innerHTML;
      var text = (btns[i].innerText || '').trim();
      results.push({
        text: text,
        html: html.substring(0, 100),
        rect: JSON.stringify(btns[i].getBoundingClientRect()),
        visible: btns[i].offsetParent !== null
      });
    }
    return results;
  });
  
  console.log('모든 가시 버튼:');
  for (var j = 0; j < btnInfo.length; j++) {
    var info = btnInfo[j];
    if (info.visible && info.text) {
      console.log('  [' + j + '] text="' + info.text + '"');
    }
  }
  
  console.log('\n사진 버튼 찾기:');
  for (var k = 0; k < btnInfo.length; k++) {
    if (btnInfo[k].text === '사진' || btnInfo[k].html.indexOf('사진') >= 0) {
      console.log('발견! idx=' + k + ' text="' + btnInfo[k].text + '"');
    }
  }
  
  await b.close();
})();
