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
  
  // Open publish dialog
  await edPage.evaluate(function() {
    var btns = document.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      if ((btns[i].innerText || '').trim() === '발행' && btns[i].offsetParent !== null) {
        btns[i].click(); return;
      }
    }
  });
  await sleep(2000);
  
  // 1. Click the category button by text '영상편집 팁'
  console.log('1. Opening category...');
  var catBtn = await edPage.evaluate(function() {
    var btns = document.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      var t = (btns[i].innerText || '').trim();
      if (t === '영상편집 팁' && btns[i].offsetParent !== null) {
        btns[i].click();
        return t;
      }
    }
    return 'not found';
  });
  console.log('   result:', catBtn);
  await sleep(2000);
  
  // 2. Look for dropdown with category options
  var dropdown = await edPage.evaluate(function() {
    // Check what new appeared
    var all = document.querySelectorAll('button, span, li, div');
    var items = [];
    for (var i = 0; i < all.length; i++) {
      var t = (all[i].innerText || '').trim();
      if (t.indexOf('영상') >= 0 || t.indexOf('빡친') >= 0 || t.indexOf('편집') >= 0) {
        if (t.length > 2 && t.length < 30 && all[i].offsetParent !== null) {
          items.push(t.substring(0, 30));
        }
      }
    }
    return items;
  });
  console.log('   dropdown items:', JSON.stringify(dropdown));
  
  // 3. If dropdown opened, find and click '영상 때문에 빡친 사람들'
  var selected = await edPage.evaluate(function() {
    var all = document.querySelectorAll('button, span, div, li, a');
    for (var i = 0; i < all.length; i++) {
      var t = (all[i].innerText || '').trim();
      if (t.indexOf('빡친 사람들') >= 0 && all[i].offsetParent !== null) {
        all[i].click();
        return t.substring(0, 20);
      }
    }
    return false;
  });
  console.log('   selected:', selected);
  await sleep(1500);
  
  // 4. Click publish confirm button
  console.log('2. Publishing...');
  var posted = await edPage.evaluate(function() {
    var btns = document.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      // confirm_btn class = the real publish button in dialog
      var cls = '';
      try { cls = (btns[i].className || '').toString(); } catch(e) {}
      if (cls.indexOf('confirm_btn') >= 0 && !btns[i].disabled) {
        btns[i].click();
        return 'confirm_btn';
      }
    }
    // fallback: find publish button inside layer
    var dialogs = document.querySelectorAll('[class*=layer_publish]');
    for (var d = 0; d < dialogs.length; d++) {
      var btns2 = dialogs[d].querySelectorAll('button');
      for (var i = 0; i < btns2.length; i++) {
        if ((btns2[i].innerText || '').trim() === '발행' && !btns2[i].disabled) {
          btns2[i].click();
          return 'dialog_publish';
        }
      }
    }
    return 'not_found';
  });
  console.log('   publish:', posted);
  await sleep(4000);
  
  console.log('URL:', edPage.url().substring(0, 100));
  var text = await edPage.evaluate(function() { return (document.body.innerText || '').substring(0, 200); });
  console.log('result:', text.substring(0, 100));
  
  await b.close();
})();
