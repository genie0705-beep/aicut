const { chromium } = require('playwright');
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
(async () => {
  var b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  var pages = b.contexts()[0].pages();
  
  var edPage = null;
  for (var i = 0; i < pages.length; i++) {
    if (pages[i].url().indexOf('PostWriteForm') >= 0) { edPage = pages[i]; break; }
  }
  if (!edPage) { console.log('error: no editor page'); await b.close(); return; }
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
  
  // 1. Click category button
  console.log('1. Opening category dropdown...');
  var opened = await edPage.evaluate(function() {
    var btn = document.querySelector('button[aria-label="카테고리 목록 버튼"]');
    if (btn && btn.offsetParent !== null) { btn.click(); return true; }
    return false;
  });
  console.log('   opened:', opened);
  await sleep(1500);
  
  // 2. Check if dropdown appeared
  var menuCheck = await edPage.evaluate(function() {
    var menus = document.querySelectorAll('[role=menu], [role=listbox], [class*=select_menu], [class*=dropdown], [class*=option_list]');
    var found = [];
    for (var i = 0; i < menus.length; i++) {
      var t = (menus[i].innerText || '').substring(0, 50);
      var cls = '';
      try { cls = (menus[i].className || '').toString().substring(0, 30); } catch(e) {}
      if (menus[i].offsetParent !== null) {
        found.push({ cls: cls, text: t });
      }
    }
    return found;
  });
  console.log('   menus:', JSON.stringify(found));
  
  // 3. Try to find and click the category option
  if (found.length > 0) {
    await sleep(1000);
    var selected = await edPage.evaluate(function() {
      var items = document.querySelectorAll('[role=menuitem], [role=option], li, span, div, a');
      for (var i = 0; i < items.length; i++) {
        var t = (items[i].innerText || '').trim();
        if (t.indexOf('빡친 사람들') >= 0 && items[i].offsetParent !== null) {
          items[i].click();
          return t.substring(0, 30);
        }
      }
      return false;
    });
    console.log('   selected:', selected);
    await sleep(1000);
  } else {
    // The menu might have the items inside the same element
    console.log('   no menu found, checking option_list...');
    var listCheck = await edPage.evaluate(function() {
      var lists = document.querySelectorAll('ul, [class*=option_list], [class*=list_item]');
      for (var i = 0; i < lists.length; i++) {
        var t = (lists[i].innerText || '').substring(0, 100);
        var cls = '';
        try { cls = (lists[i].className || '').toString().substring(0, 40); } catch(e) {}
        if (t.indexOf('빡친') >= 0) {
          return { cls: cls, text: t };
        }
      }
      return null;
    });
    console.log('   lists:', JSON.stringify(listCheck));
    
    if (listCheck) {
      await edPage.evaluate(function() {
        var lists = document.querySelectorAll('ul, li');
        for (var i = 0; i < lists.length; i++) {
          var t = (lists[i].innerText || '').trim();
          if (t.indexOf('빡친 사람들') >= 0) {
            lists[i].click();
            return;
          }
        }
      });
      console.log('   clicked list item');
      await sleep(1000);
    }
  }
  
  // 4. Click publish button inside dialog
  console.log('3. Publishing...');
  var posted = await edPage.evaluate(function() {
    var btns = document.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      var t = (btns[i].innerText || '').trim();
      if (t === '발행' && btns[i].offsetParent !== null && !btns[i].disabled) {
        var parent = btns[i].closest('[class*=layer_publish]');
        if (!parent) {
          // check if dialog is open
          var dialogs = document.querySelectorAll('[class*=layer_popup][class*=is_show]');
          if (dialogs.length > 0) parent = dialogs[0];
        }
        if (parent) { btns[i].click(); return 'dialog_publish'; }
      }
    }
    return 'not_found';
  });
  console.log('   publish:', posted);
  await sleep(4000);
  
  console.log('URL:', edPage.url().substring(0, 100));
  
  var afterText = await edPage.evaluate(function() { return (document.body.innerText || '').substring(0, 200); });
  console.log('After:', afterText.substring(0, 100));
  
  await b.close();
})();
