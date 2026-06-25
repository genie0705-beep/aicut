const { chromium } = require('playwright');
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
(async () => {
  var b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  var pages = b.contexts()[0].pages();
  
  var edPage = null;
  for (var i = 0; i < pages.length; i++) {
    if (pages[i].url().indexOf('PostWriteForm') >= 0) { edPage = pages[i]; break; }
  }
  if (!edPage) { console.log('에디터 없음'); await b.close(); return; }
  await edPage.bringToFront();
  await sleep(1000);
  
  // 발행 다이얼로그 열기
  await edPage.evaluate(function() {
    var btns = document.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      if ((btns[i].innerText || '').trim() === '발행' && btns[i].offsetParent !== null) {
        btns[i].click(); return;
      }
    }
  });
  await sleep(2000);
  
  // 발행 레이어 HTML 분석
  var publishHTML = await edPage.evaluate(function() {
    var layers = document.querySelectorAll('div');
    for (var i = 0; i < layers.length; i++) {
      var cls = '';
      try { cls = (layers[i].className || '').toString(); } catch(e) { cls = ''; }
      if (cls.indexOf('layer_publish') >= 0) {
        return layers[i].innerHTML.substring(0, 2000);
      }
    }
    return 'layer_publish not found';
  });
  
  console.log('layer_publish HTML:');
  console.log(publishHTML);
  
  await b.close();
})();
