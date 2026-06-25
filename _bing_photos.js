// Bing Image Creator - URL 파라미터 방식
const { chromium } = require('playwright');
const fs = require('fs');
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });

  var dir = 'C:\\Users\\paul\\.openclaw\\workspace\\';
  var prompts = [
    'YouTuber recording video in modern studio with professional lighting and camera equipment photorealistic cinematic',
    'Video editor working on dual monitor setup editing timeline footage creative workspace warm lighting',
    'Content creator brainstorming on laptop in cozy home office natural lighting candid moment'
  ];
  var filenames = ['aicut_ai_photo_1.jpg', 'aicut_ai_photo_2.jpg', 'aicut_ai_photo_3.jpg'];

  for (var i = 0; i < prompts.length; i++) {
    console.log('[' + (i+1) + '/3] 생성 중...');
    var page = await ctx.newPage();
    
    // URL에 프롬프트를 포함시켜 직접 이동
    var encoded = encodeURIComponent(prompts[i]);
    await page.goto('https://www.bing.com/images/create?q=' + encoded, { waitUntil: 'networkidle', timeout: 30000 }).catch(function(){});
    await sleep(5000);

    // 만들기 버튼 (자동 입력된 상태에서)
    var btnClicked = await page.evaluate(function() {
      var all = document.querySelectorAll('button, a, span');
      for (var i = 0; i < all.length; i++) {
        var t = (all[i].innerText || '').trim();
        if (t === '만들기' && all[i].offsetParent !== null) {
          all[i].click();
          return true;
        }
        if (t === 'Create' && all[i].offsetParent !== null) {
          all[i].click();
          return true;
        }
      }
      return false;
    });
    console.log('   만들기:', btnClicked ? '✅' : '❌');

    // 생성 완료 대기
    var found = false;
    for (var w = 0; w < 60; w++) {
      await sleep(2000);
      var check = await page.evaluate(function() {
        var imgs = document.querySelectorAll('img');
        for (var i = 0; i < imgs.length; i++) {
          var src = imgs[i].src || '';
          if (src.indexOf('bing.com/th?id=') >= 0 && imgs[i].naturalWidth > 100) {
            return { ok: true, src: src };
          }
        }
        // imgGrid 클래스 확인
        var grid = document.querySelector('.imgGrid, [class*=\"gallery\"], [class*=\"result\"]');
        if (grid) {
          var gridImgs = grid.querySelectorAll('img');
          for (var i = 0; i < gridImgs.length; i++) {
            var s = gridImgs[i].src || '';
            if (s.indexOf('bing.com/th?id=') >= 0) {
              return { ok: true, src: s };
            }
          }
        }
        return { ok: false };
      });

      if (check.ok) {
        found = true;
        console.log('   ✅ 생성 완료!');

        // 고해상도로 다운로드
        var imgSrc = check.src;
        var highResSrc = imgSrc.split('&')[0] + '&w=700&h=700&c=7';
        try {
          var resp = await fetch(highResSrc);
          if (resp.ok) {
            var buffer = Buffer.from(await resp.arrayBuffer());
            fs.writeFileSync(dir + filenames[i], buffer);
            console.log('   💾 저장:', filenames[i], '(' + Math.round(buffer.length/1024) + 'KB)');
          }
        } catch(e) {
          console.log('   ⚠️ 다운로드 실패');
        }
        break;
      }
    }
    if (!found) console.log('   ❌ 시간초과');
    
    await page.close();
    await sleep(2000);
  }

  // 결과
  console.log('\n=== 생성 완료 ===');
  for (var i = 0; i < filenames.length; i++) {
    try {
      var s = Math.round(fs.statSync(dir + filenames[i]).size / 1024);
      console.log((i+1) + '. ' + filenames[i] + ' (' + s + 'KB)');
    } catch(e) {
      console.log((i+1) + '. ' + filenames[i] + ' ❌');
    }
  }

  await b.close();
})();
