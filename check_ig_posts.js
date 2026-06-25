const { chromium } = require('playwright');
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
(async () => {
  var b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  var pages = b.contexts()[0].pages();
  
  var igPage = null;
  for (var i = 0; i < pages.length; i++) {
    if (pages[i].url().indexOf('instagram.com') >= 0) { igPage = pages[i]; break; }
  }
  
  if (!igPage) { console.log('인스타 탭 없음'); await b.close(); return; }
  await igPage.bringToFront();
  await sleep(2000);
  
  // Go to profile
  if (igPage.url().indexOf('aicut.official') < 0) {
    await igPage.goto('https://www.instagram.com/aicut.official/', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(function(){});
    await sleep(4000);
  }
  
  // Get posts
  var posts = await igPage.evaluate(function() {
    var links = document.querySelectorAll('a[href*="/p/"]');
    var results = [];
    for (var i = 0; i < Math.min(links.length, 12); i++) {
      var href = links[i].getAttribute('href') || '';
      var img = links[i].querySelector('img');
      var alt = img ? (img.getAttribute('alt') || '') : '';
      results.push({
        href: href.substring(0, 35),
        alt: alt.substring(0, 60)
      });
    }
    return results;
  });
  
  if (posts.length > 0) {
    console.log('=== 최근 게시물 ' + posts.length + '개 ===');
    for (var i = 0; i < posts.length; i++) {
      console.log((i+1) + ': ' + posts[i].href + ' | ' + posts[i].alt);
    }
  } else {
    console.log('게시물 링크 없음, 스크롤 시도');
    await igPage.evaluate(function() { window.scrollBy(0, 300); });
    await sleep(2000);
    
    var posts2 = await igPage.evaluate(function() {
      var links = document.querySelectorAll('a[href*="/p/"]');
      var results = [];
      for (var i = 0; i < Math.min(links.length, 12); i++) {
        var href = links[i].getAttribute('href') || '';
        var img = links[i].querySelector('img');
        var alt = img ? (img.getAttribute('alt') || '') : '';
        results.push({ href: href.substring(0, 35), alt: alt.substring(0, 60) });
      }
      return results;
    });
    
    console.log('=== 스크롤 후 게시물 ' + posts2.length + '개 ===');
    for (var i = 0; i < posts2.length; i++) {
      console.log((i+1) + ': ' + posts2[i].href + ' | ' + posts2[i].alt);
    }
  }
  
  await b.close();
})();
