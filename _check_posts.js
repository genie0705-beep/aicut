// 인스타/Threads 게시물 확인 + 톤앤매너 수정
const { chromium } = require('playwright');
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });
  var pages = ctx.pages();

  // ============ Instagram ============
  console.log('=== Instagram ===');
  var ip = null;
  for (var i = 0; i < pages.length; i++) {
    if (pages[i].url().indexOf('instagram.com') >= 0) { ip = pages[i]; break; }
  }
  if (ip) {
    await ip.bringToFront();
    await ip.goto('https://www.instagram.com/aicut.official/', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(function(){});
    await sleep(5000);
    var u = ip.url();
    console.log('URL:', u.substring(0, 80));
    
    var info = await ip.evaluate(function() {
      var r = {};
      r.articles = document.querySelectorAll('article').length;
      r.postLinks = [];
      document.querySelectorAll('a').forEach(function(a) {
        var href = a.href || '';
        if (href.indexOf('/p/') >= 0) {
          r.postLinks.push(href.substring(0, 70));
        }
      });
      return r;
    });
    console.log('게시물 수:', JSON.stringify(info));
  }

  // ============ Threads ============
  console.log('\n=== Threads ===');
  var tp = null;
  for (var i = 0; i < pages.length; i++) {
    if (pages[i].url().indexOf('threads.com') >= 0) { tp = pages[i]; break; }
  }
  if (tp) {
    await tp.bringToFront();
    await sleep(3000);
    
    var recentPosts = await tp.evaluate(function() {
      // 최근 게시물 텍스트 확인
      var articles = document.querySelectorAll('article, div[data-testid]');
      var r = { articles: articles.length, texts: [] };
      document.querySelectorAll('*').forEach(function(el) {
        var t = (el.innerText || '').trim();
        if (t.indexOf('온라인 강의') >= 0 && t.length < 500) {
          r.texts.push(t.substring(0, 200));
        }
      });
      return r;
    });
    console.log('Threads 게시물:', JSON.stringify(recentPosts, null, 2));
  }

  await b.close();
})();
