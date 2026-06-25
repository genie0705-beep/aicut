const { chromium } = require('playwright');
const fs = require('fs');
const DIR = 'C:/Users/paul/.openclaw/workspace';
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  var b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  var pages = b.contexts()[0].pages();
  var igPage = null;
  for (var i = 0; i < pages.length; i++) {
    if (pages[i].url().indexOf('instagram.com') >= 0) { igPage = pages[i]; break; }
  }
  if (!igPage) { console.log('no page'); await b.close(); return; }
  
  await igPage.bringToFront();
  await sleep(2000);
  
  // Open new post dialog
  await igPage.evaluate(function() {
    var svgs = document.querySelectorAll('svg');
    for (var i = 0; i < svgs.length; i++) {
      var t = svgs[i].querySelector('title');
      if (t && (t.textContent.indexOf('새로운 게시물') >= 0 || t.textContent.indexOf('New post') >= 0)) {
        var btn = svgs[i].closest('[role=button], button, a, div');
        if (btn) { btn.click(); return; }
      }
    }
  });
  await sleep(2000);
  
  // Select post option
  await igPage.evaluate(function() {
    var items = document.querySelectorAll('button, [role=button], a, span');
    for (var i = 0; i < items.length; i++) {
      var t = (items[i].innerText || '').trim();
      if (t === '게시물' || t === 'Post') { items[i].click(); return; }
    }
  });
  await sleep(2000);
  
  // Analyze the upload dialog structure
  var info = await igPage.evaluate(function() {
    var r = {};
    // Check for drop zone / upload area
    r.bodyText = (document.body.innerText || '').substring(0, 500);
    
    // Look for drag/drop related elements
    var allDivs = document.querySelectorAll('div');
    var dropZones = [];
    for (var i = 0; i < allDivs.length; i++) {
      var d = allDivs[i];
      var t = (d.innerText || '').trim();
      if ((t.indexOf('끌어') >= 0 || t.indexOf('드래그') >= 0 || t.indexOf('drag') >= 0 || t.indexOf('Drop') >= 0 || t.indexOf('컴퓨터') >= 0 || t.indexOf('파일') >= 0) && t.length < 100) {
        var rect = d.getBoundingClientRect();
        if (rect.width > 50) {
          dropZones.push({
            text: t.substring(0, 40),
            tag: d.tagName,
            x: Math.round(rect.x), y: Math.round(rect.y),
            w: Math.round(rect.width), h: Math.round(rect.height)
          });
        }
      }
    }
    r.dropZones = dropZones;
    
    // Check file input
    var fi = document.querySelector('input[type=file]');
    r.fileInput = fi ? {
      multiple: fi.multiple,
      accept: fi.accept
    } : null;
    
    // Check aria-dropzone or role
    var dropRoles = document.querySelectorAll('[aria-dropeffect], [role=dialog]');
    r.dialogs = dropRoles.length;
    
    // All visible buttons in dialog
    var btns = document.querySelectorAll('button, [role=button]');
    r.buttons = [];
    for (var i = 0; i < btns.length; i++) {
      var t = (btns[i].innerText || '').trim();
      if (t && btns[i].offsetParent !== null) {
        r.buttons.push(t.substring(0, 20));
      }
    }
    
    return r;
  });
  
  console.log('=== Upload Dialog Analysis ===');
  console.log('body:', info.bodyText.substring(0, 200));
  console.log('file input:', JSON.stringify(info.fileInput));
  console.log('buttons:', JSON.stringify(info.buttons));
  console.log('drop zones:', JSON.stringify(info.dropZones));
  
  process.exit(0);
})();
