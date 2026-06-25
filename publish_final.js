const { chromium } = require('playwright');
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
(async () => {
  var b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  var pages = b.contexts()[0].pages();
  var edPage = null;
  for (var i = 0; i < pages.length; i++) {
    if (pages[i].url().indexOf('PostWriteForm') >= 0) { edPage = pages[i]; break; }
  }
  if (!edPage) { console.log('no page'); await b.close(); return; }
  await edPage.bringToFront();
  await sleep(1000);
  
  // Step 1: Open publish dialog
  console.log('1. Opening publish dialog...');
  await edPage.evaluate(function() {
    var btns = document.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      var cls = '';
      try { cls = (btns[i].className || '').toString(); } catch(e) {}
      if (cls.indexOf('publish_btn') >= 0 && btns[i].offsetParent !== null) {
        btns[i].click();
        return;
      }
    }
  });
  await sleep(3000);
  
  // Step 2: Click category button
  console.log('2. Clicking category button...');
  await edPage.evaluate(function() {
    var btns = document.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      var aria = btns[i].getAttribute('aria-label') || '';
      if (aria === '카테고리 목록 버튼' && btns[i].offsetParent !== null) {
        btns[i].click();
        return;
      }
    }
  });
  await sleep(2000);
  
  // Step 3: Find and click '영상 때문에 빡친 사람들'
  console.log('3. Selecting category...');
  var selected = await edPage.evaluate(function() {
    var all = document.querySelectorAll('button, span, div, li, a');
    for (var i = 0; i < all.length; i++) {
      var t = (all[i].innerText || '').trim();
      if (t.indexOf('빡친 사람들') >= 0 && all[i].offsetParent !== null) {
        all[i].click();
        return true;
      }
    }
    return false;
  });
  console.log('   result:', selected);
  await sleep(2000);
  
  // Step 4: Click confirm publish button
  console.log('4. Confirming publish...');
  var posted = await edPage.evaluate(function() {
    // Find the confirm button inside publish dialog
    var layers = document.querySelectorAll('[class*=layer_publish]');
    for (var l = 0; l < layers.length; l++) {
      var btns = layers[l].querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        var t = (btns[i].innerText || '').trim();
        var cls = '';
        try { cls = (btns[i].className || '').toString(); } catch(e) {}
        if (t === '발행' && !btns[i].disabled) {
          btns[i].click();
          return 'dialog_publish';
        }
      }
    }
    // Fallback: find by class
    var btns = document.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      var cls = '';
      try { cls = (btns[i].className || '').toString(); } catch(e) {}
      if (cls.indexOf('confirm_btn') >= 0 && !btns[i].disabled) {
        btns[i].click();
        return 'confirm_btn';
      }
    }
    return 'not_found';
  });
  console.log('   result:', posted);
  await sleep(5000);
  
  console.log('URL:', edPage.url().substring(0, 100));
  var text = await edPage.evaluate(function() { return (document.body.innerText || '').substring(0, 300); });
  console.log('Result:', text.substring(0, 200));
  
  await b.close();
})();
