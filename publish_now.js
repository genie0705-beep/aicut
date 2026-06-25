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
  
  // JS click on publish button
  await page.evaluate(function() {
    var btn = document.querySelector('button.publish_btn__m9KHH');
    if (btn) btn.click();
  });
  console.log('1. publish btn clicked');
  await sleep(3000);
  
  // Check and click category
  var ok = await page.evaluate(function() {
    var layers = document.querySelectorAll('[class*=layer_publish]');
    if (!layers.length || !layers[0].offsetParent) return 'dialog not visible';
    var catBtn = document.querySelector('button[aria-label*="카테고리"]');
    if (!catBtn) return 'no category btn';
    catBtn.click();
    return 'category dropdown opened';
  });
  console.log('2. ' + ok);
  await sleep(2000);
  
  // Select category
  var sel = await page.evaluate(function() {
    var all = document.querySelectorAll('button, div, li, span, a');
    for (var i = 0; i < all.length; i++) {
      var t = (all[i].innerText || '').trim();
      if (t.indexOf('빡친 사람들') >= 0 && all[i].offsetParent) {
        all[i].click();
        return 'selected: ' + t.substring(0, 20);
      }
    }
    return 'not found';
  });
  console.log('3. ' + sel);
  await sleep(1500);
  
  // Click confirm publish
  var pub = await page.evaluate(function() {
    var layers = document.querySelectorAll('[class*=layer_publish]');
    for (var l = 0; l < layers.length; l++) {
      var btns = layers[l].querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        if ((btns[i].innerText || '').trim() === '발행' && !btns[i].disabled) {
          btns[i].click();
          return 'published!';
        }
      }
    }
    return 'no confirm btn';
  });
  console.log('4. ' + pub);
  await sleep(5000);
  console.log('URL:', page.url().substring(0, 100));
  
  process.exit(0);
})();
