const { chromium } = require('playwright');
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  var b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  var page = b.contexts()[0].pages()[0];
  
  var keywords = ['영상편집 프로그램 추천', '숏폼 영상 제작', '영상 편집 업체'];
  
  for (var ki = 0; ki < keywords.length; ki++) {
    console.log('\n[' + (ki+1) + '] ' + keywords[ki]);
    await page.goto('https://search.naver.com/search.naver?query=' + encodeURIComponent(keywords[ki]) + '&where=kin', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(function(){});
    await sleep(3000);
    
    var qs = await page.evaluate(function() {
      var links = document.querySelectorAll('a[href*="kin.naver.com/qna/"]');
      var items = [];
      for (var i = 0; i < links.length; i++) {
        var href = links[i].getAttribute('href') || '';
        var title = (links[i].innerText || '').trim();
        var dup = false;
        for (var j = 0; j < items.length; j++) {
          if (items[j].href === href) dup = true;
        }
        if (!dup && title.length > 5 && href.indexOf('/qna/detail') >= 0) {
          items.push({ title: title.substring(0, 50), href: href.substring(0, 90) });
        }
      }
      return items;
    });
    
    console.log('  ' + qs.length + '개');
    for (var qi = 0; qi < Math.min(qs.length, 3); qi++) {
      console.log('   - ' + qs[qi].title);
    }
    
    await sleep(2000);
  }
  
  await b.close();
})();
