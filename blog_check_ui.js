const { chromium } = require('playwright');

async function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  var pages = ctx.pages();
  for (var p = 0; p < pages.length; p++) {
    if (pages[p].url().indexOf('aicut') >= 0 && pages[p].url().indexOf('Write') >= 0) {
      await pages[p].bringToFront();
      await sleep(3000);
      
      var mf = null;
      for (var fi = 0; fi < pages[p].frames().length; fi++) {
        if (pages[p].frames()[fi].name() === 'mainFrame') { mf = pages[p].frames()[fi]; break; }
      }
      if (!mf) { break; }

      // 에디터 클릭
      await pages[p].mouse.click(510, 400);
      await sleep(500);
      
      // 사진 버튼 클릭
      await pages[p].mouse.click(36, 74);
      await sleep(2000);
      
      // 업로드 전 mainFrame UI
      var beforeUI = await mf.evaluate(function() {
        var result = [];
        document.querySelectorAll('button, span, a, div').forEach(function(el) {
          try {
            var t = (el.innerText || '').trim();
            if (t && t.length > 0 && t.length < 15 && el.offsetParent !== null) {
              var r = el.getBoundingClientRect();
              if (r.y > 0 && r.y < 1000) {
                result.push({ text: t, y: Math.round(r.y) });
              }
            }
          } catch(e) {}
        });
        return result;
      });
      
      console.log('사진 버튼 클릭 후 UI 버튼:');
      beforeUI.sort(function(a,b) { return a.y - b.y; }).forEach(function(b) {
        console.log('  y=' + b.y + ' ' + b.text);
      });
      
      break;
    }
  }
  await b.close();
})();
