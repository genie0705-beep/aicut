// Bing Image Creator 재시도 - 5분 대기
const { chromium } = require('playwright');
const fs = require('fs');
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });

  var dir = 'C:\\Users\\paul\\.openclaw\\workspace\\';
  var prompts = [
    'youtuber recording video in modern studio professional lighting, photorealistic, cinematic quality',
    'person video editing on computer desk with coffee, creative workspace, modern office',
    'content creator filming on smartphone in cozy home office, natural light, candid'
  ];
  var files = ['aicut_ai_photo_1.jpg', 'aicut_ai_photo_2.jpg', 'aicut_ai_photo_3.jpg'];
  var success = 0;

  for (var i = 0; i < prompts.length; i++) {
    console.log('[' + (i+1) + '/3] ' + files[i]);
    var page = await ctx.newPage();

    // Bing Image Creator 접속
    await page.goto('https://www.bing.com/create', { waitUntil: 'networkidle', timeout: 20000 }).catch(function(){});
    await sleep(3000);

    // textarea 찾기
    var ta = await page.$('textarea');
    if (ta) {
      await ta.fill(prompts[i]);
      await sleep(500);
    }

    // 만들기 버튼
    await page.evaluate(function() {
      var all = document.querySelectorAll('button');
      for (var i = 0; i < all.length; i++) {
        var t = (all[i].innerText || '').trim();
        if ((t === '만들기' || t === 'Create') && all[i].offsetParent !== null) {
          all[i].click(); return;
        }
      }
    });
    console.log('   생성 시작, 대기 중...');

    // 5분 대기하며 이미지 감지
    var done = false;
    var startUrl = page.url();
    
    for (var w = 0; w < 150; w++) {
      await sleep(2000);
      try {
        // URL 변경 감지
        var curUrl = page.url();
        if (curUrl !== startUrl && curUrl.indexOf('create') >= 0) {
          // 생성 완료 페이지로 이동됨
        }

        // 이미지 감지
        var check = await page.evaluate(function() {
          // 모든 img 태그 검사
          var imgs = document.querySelectorAll('img');
          for (var i = 0; i < imgs.length; i++) {
            var src = imgs[i].src || '';
            if (src.indexOf('th?id=') >= 0 && imgs[i].naturalWidth > 50) {
              return { ok: true, src: src };
            }
          }
          // 배경 이미지 확인
          var divs = document.querySelectorAll('div[class]');
          for (var i = 0; i < divs.length; i++) {
            var style = divs[i].getAttribute('style') || '';
            if (style.indexOf('bing.com/th?id=') >= 0) {
              var match = style.match(/https?:[^"\'\\s]+th?id=[^"\'\\s]+/);
              if (match) return { ok: true, src: match[0] };
            }
          }
          return { ok: false };
        });

        if (check.ok) {
          // 고해상도 다운로드
          var src = check.src;
          var downloadUrl = src.split('&')[0] + '&w=700&h=700&c=7';
          var resp = await fetch(downloadUrl);
          if (resp.ok) {
            var buf = Buffer.from(await resp.arrayBuffer());
            fs.writeFileSync(dir + files[i], buf);
            var kb = Math.round(buf.length / 1024);
            console.log('   ✅ ' + kb + 'KB (' + ((w+1)*2) + '초)');
            success++;
            done = true;
          }
          break;
        }
      } catch(e) {}
    }

    if (!done) console.log('   ❌ 실패');
    await page.close();
    if (i < prompts.length - 1) await sleep(2000);
  }

  console.log('\n=== 결과: ' + success + '/' + files.length + ' ===');
  for (var i = 0; i < files.length; i++) {
    try {
      console.log((i+1) + '. ' + files[i] + ' (' + Math.round(fs.statSync(dir + files[i]).size/1024) + 'KB)');
    } catch(e) {
      console.log((i+1) + '. ' + files[i] + ' ❌');
    }
  }

  await b.close();
})();
