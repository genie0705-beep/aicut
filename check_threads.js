const { chromium } = require('playwright');
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
(async () => {
  var b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  var pages = b.contexts()[0].pages();
  
  var thPage = pages[1];
  await thPage.bringToFront();
  await sleep(2000);
  
  // "새로운 소식" 클릭
  await thPage.evaluate(function() {
    var all = document.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) {
      var t = (all[i].innerText || '').trim();
      if (t.indexOf('새로운 소식') >= 0) {
        all[i].click();
        return;
      }
    }
  });
  await sleep(3000);
  
  // 분석
  var info = await thPage.evaluate(function() {
    var r = {};
    r.ce = document.querySelectorAll('[contenteditable]').length;
    r.textbox = document.querySelectorAll('[role=textbox]').length;
    r.textarea = document.querySelectorAll('textarea').length;
    r.ceDivs = document.querySelectorAll('div[contenteditable]').length;
    
    // input details
    var inputs = document.querySelectorAll('input');
    r.inputs = [];
    for (var i = 0; i < inputs.length; i++) {
      r.inputs.push({
        t: inputs[i].type,
        p: (inputs[i].placeholder || '').substring(0, 15),
        h: inputs[i].type === 'hidden'
      });
    }
    
    // 모든 visible div with text
    var texts = [];
    var allDivs = document.querySelectorAll('div');
    for (var i = 0; i < allDivs.length; i++) {
      var d = allDivs[i];
      if (d.offsetParent !== null) {
        var txt = (d.innerText || '').trim();
        if (txt && txt.length > 3 && txt.length < 60) {
          texts.push(txt.substring(0, 25));
          if (texts.length >= 15) break;
        }
      }
    }
    r.visibleTexts = texts;
    
    return r;
  });
  
  console.log('분석:', JSON.stringify(info, null, 2));
  
  await b.close();
})();
