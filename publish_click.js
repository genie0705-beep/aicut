const { chromium } = require('playwright');
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  var b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  var pages = b.contexts()[0].pages();
  var page = null;
  for (var i = 0; i < pages.length; i++) {
    if (pages[i].url().indexOf('PostWriteForm') >= 0) { page = pages[i]; break; }
  }
  if (!page) { console.log('no page'); await b.close(); return; }
  await page.bringToFront();
  await sleep(500);
  
  // Step 1: Find publish button and click it
  console.log('1. Click toolbar publish button');
  var publishBtn = await page.$('button.publish_btn__m9KHH');
  if (!publishBtn) {
    console.log('   publish_btn class not found, trying text search');
    // Fallback
    await page.evaluate(function() {
      var btns = document.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        if ((btns[i].innerText || '').trim() === '발행' && btns[i].offsetParent !== null) {
          btns[i].click(); return;
        }
      }
    });
  } else {
    await publishBtn.click();
    console.log('   clicked via selector');
  }
  await sleep(3000);
  
  // Step 2: Check if dialog is open, click category button
  console.log('2. Check dialog');
  var layerCheck = await page.evaluate(function() {
    var layers = document.querySelectorAll('[class*=layer_publish]');
    for (var i = 0; i < layers.length; i++) {
      if (layers[i].offsetParent !== null) return true;
    }
    return false;
  });
  console.log('   dialog open:', layerCheck);
  
  if (layerCheck) {
    // Click category button
    var catBtn = await page.$('button[aria-label="카테고리 목록 버튼"]');
    if (catBtn) {
      await catBtn.click();
      console.log('   category button clicked');
    } else {
      // Try by text
      await page.evaluate(function() {
        var btns = document.querySelectorAll('button');
        for (var i = 0; i < btns.length; i++) {
          var t = (btns[i].innerText || '').trim();
          if (t === '영상편집 팁' && btns[i].offsetParent !== null) {
            btns[i].click(); return;
          }
        }
      });
      console.log('   category clicked by text');
    }
    await sleep(2000);
    
    // Step 3: Find category and click
    console.log('3. Select category');
    var catSelected = await page.evaluate(function() {
      var items = document.querySelectorAll('button, span, div, li, a');
      for (var i = 0; i < items.length; i++) {
        var t = (items[i].innerText || '').trim();
        if (t.indexOf('빡친 사람들') >= 0 && items[i].offsetParent !== null) {
          items[i].click(); return true;
        }
      }
      return false;
    });
    console.log('   selected:', catSelected);
    await sleep(1500);
    
    // Step 4: Click confirm publish button
    console.log('4. Click confirm publish');
    var confirmBtn = await page.$('button.confirm_btn__WEaBq');
    if (confirmBtn) {
      await confirmBtn.click();
      console.log('   clicked via class');
    } else {
      await page.evaluate(function() {
        var layers = document.querySelectorAll('[class*=layer_publish]');
        for (var l = 0; l < layers.length; l++) {
          var btns = layers[l].querySelectorAll('button');
          for (var i = 0; i < btns.length; i++) {
            if ((btns[i].innerText || '').trim() === '발행' && !btns[i].disabled) {
              btns[i].click(); return;
            }
          }
        }
      });
      console.log('   clicked via layer search');
    }
    await sleep(5000);
  } else {
    console.log('   dialog not open, cannot publish');
  }
  
  console.log('URL:', page.url().substring(0, 100));
  var result = await page.evaluate(function() { return (document.body.innerText || '').substring(0, 300); });
  console.log('Result:', result.substring(0, 150));
  
  await b.close();
})();
