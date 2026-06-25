// Threads 게시물 확인 + 게시 시도 최종
const { chromium } = require('playwright');
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });
  var pages = ctx.pages();
  
  var tp = null;
  for (var i = 0; i < pages.length; i++) {
    if (pages[i].url().indexOf('threads.com') >= 0) { tp = pages[i]; break; }
  }
  if (!tp) { await b.close(); return; }
  
  await tp.bringToFront();
  await tp.goto('https://www.threads.com/@aicut.official', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(function(){});
  await sleep(4000);
  
  var url = tp.url();
  console.log('URL:', url);
  
  // 모든 게시물 텍스트 수집
  var posts = await tp.evaluate(function() {
    var r = [];
    // 프로필 영역에서 게시물만
    var allSpans = document.querySelectorAll('span, div, p');
    for (var i = 0; i < allSpans.length; i++) {
      var t = (allSpans[i].innerText || '').trim();
      if (t.indexOf('aicut.official') >= 0 && t.length > 50 && t.length < 500) {
        r.push(t.substring(0, 150));
      }
    }
    return r;
  });
  
  console.log('\n발견된 게시물 (' + posts.length + '개):');
  for (var i = 0; i < posts.length; i++) {
    console.log('---');
    console.log(posts[i]);
  }
  
  await b.close();
})();
