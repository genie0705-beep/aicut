// Bing Image Creator - 직접 생성
const { chromium } = require('playwright');
const fs = require('fs');
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });

  var dir = 'C:\\Users\\paul\\.openclaw\\workspace\\';
  var tasks = [
    { prompt: 'YouTuber recording video in modern studio with professional lighting and camera equipment photorealistic cinematic', file: 'aicut_ai_photo_1.jpg' },
    { prompt: 'Video editor working on dual monitor setup editing timeline footage creative workspace warm lighting', file: 'aicut_ai_photo_2.jpg' },
    { prompt: 'Content creator brainstorming on laptop in cozy home office natural lighting candid moment', file: 'aicut_ai_photo_3.jpg' }
  ];
  var success = 0;

  for (var t = 0; t < tasks.length; t++) {
    console.log('[' + (t+1) + '/3] ' + tasks[t].file);
    var page = await ctx.newPage();

    var url = 'https://www.bing.com/images/create?q=' + encodeURIComponent(tasks[t].prompt);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch(function(){});
    await sleep(5000);

    // 만들기 버튼 클릭
    await page.evaluate(function() {
      var all = document.querySelectorAll('button, a, span');
      for (var i = 0; i < all.length; i++) {
        var t = (all[i].innerText || '').trim();
        if ((t === '만들기' || t === 'Create') && all[i].offsetParent !== null) {
          all[i].click(); return;
        }
      }
    });

    // 생성 완료 대기 (최대 3분)
    var done = false;
    for (var wait = 0; wait < 90; wait++) {
      await sleep(2000);
      try {
        var check = await page.evaluate(function() {
          var imgs = document.querySelectorAll('img');
          for (var i = 0; i < imgs.length; i++) {
            var src = imgs[i].src || '';
            if (src.indexOf('th?id=') >= 0 && imgs[i].naturalWidth > 100) {
              return { ok: true, src: src };
            }
          }
          return { ok: false };
        });

        if (check.ok) {
          var fullUrl = check.src.split('&')[0] + '&w=700&h=700&c=7';
          var resp = await fetch(fullUrl);
          if (resp.ok) {
            var buf = Buffer.from(await resp.arrayBuffer());
            fs.writeFileSync(dir + tasks[t].file, buf);
            var kb = Math.round(buf.length / 1024);
            console.log('   ✅ ' + kb + 'KB (' + ((wait+1)*2) + '초)');
            success++;
            done = true;
          }
          break;
        }
      } catch(e) {}
    }

    if (!done) console.log('   ❌ 시간초과');
    await page.close();
    if (t < tasks.length - 1) await sleep(2000);
  }

  console.log('\n=== 결과: ' + success + '/' + tasks.length + ' ===');
  for (var i = 0; i < tasks.length; i++) {
    try {
      var s = Math.round(fs.statSync(dir + tasks[i].file).size / 1024);
      console.log((i+1) + '. ' + tasks[i].file + ' (' + s + 'KB)');
    } catch(e) {
      console.log((i+1) + '. ' + tasks[i].file + ' ❌');
    }
  }

  await b.close();
})();
