// 사진 소스 확보 (Unsplash)
const { chromium } = require('playwright');
const fs = require('fs');
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });

  var photoDir = 'C:\\Users\\paul\\.openclaw\\workspace\\';
  var queries = ['content-creator', 'video-editing', 'youtube-studio', 'camera-recording', 'office-creative'];

  for (var q = 0; q < queries.length; q++) {
    var page = await ctx.newPage();
    var filename = 'aicut_photo_creator_' + (q+1) + '.jpg';
    console.log('[' + (q+1) + '/5] ' + queries[q]);

    try {
      await page.goto('https://unsplash.com/s/photos/' + queries[q], { waitUntil: 'networkidle', timeout: 20000 }).catch(function(){});
      await sleep(3000);

      // 첫 번째 이미지 URL 추출
      var imgUrl = await page.evaluate(function() {
        var imgs = document.querySelectorAll('img');
        for (var i = 0; i < imgs.length; i++) {
          var src = imgs[i].src || '';
          // Unsplash CDN 이미지, 적당한 해상도
          if (src.indexOf('images.unsplash.com') >= 0 && src.indexOf('w=400') >= 0) {
            return src.replace('w=400', 'w=800');
          }
          if (src.indexOf('images.unsplash.com') >= 0 && src.indexOf('fit=crop') >= 0) {
            return src;
          }
        }
        return null;
      });

      if (imgUrl) {
        var resp = await fetch(imgUrl);
        if (resp.ok) {
          var buffer = Buffer.from(await resp.arrayBuffer());
          var filepath = photoDir + filename;
          fs.writeFileSync(filepath, buffer);
          var size = Math.round(fs.statSync(filepath).size / 1024);
          console.log('   ✅ ' + filename + ' (' + size + 'KB)');
        } else {
          console.log('   ❌ 다운로드 실패 (status: ' + resp.status + ')');
        }
      } else {
        console.log('   ❌ 이미지 URL 못 찾음');
      }
    } catch(e) {
      console.log('   ❌ 오류: ' + e.message.substring(0, 60));
    }

    await page.close();
    await sleep(2000);
  }

  // 결과 목록
  console.log('\n=== 확보한 사진 소스 ===');
  var files = fs.readdirSync(photoDir).filter(function(f) { return f.indexOf('aicut_photo_creator') >= 0; });
  files.sort();
  for (var i = 0; i < files.length; i++) {
    var stat = fs.statSync(photoDir + files[i]);
    console.log((i+1) + '. ' + files[i] + ' (' + Math.round(stat.size/1024) + 'KB)');
  }
  console.log('총 ' + files.length + '장');

  await b.close();
})();
