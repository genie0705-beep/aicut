// Pixabay 고해상도 사진 다운로드
const { chromium } = require('playwright');
const fs = require('fs');
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });

  var dir = 'C:\\Users\\paul\\.openclaw\\workspace\\';
  var keywords = [
    ['youtube+studio', 'aicut_photo_studio_1.jpg'],
    ['video+editing', 'aicut_photo_editing_2.jpg'],
    ['content+creator', 'aicut_photo_creator_3.jpg'],
    ['camera+recording', 'aicut_photo_camera_4.jpg'],
    ['office+creative', 'aicut_photo_office_5.jpg'],
  ];

  for (var k = 0; k < keywords.length; k++) {
    var page = await ctx.newPage();
    var query = keywords[k][0];
    var filename = keywords[k][1];
    console.log('[' + (k+1) + '/5] ' + query);

    try {
      await page.goto('https://pixabay.com/photos/search/' + query + '/?order=ec', { waitUntil: 'networkidle', timeout: 20000 }).catch(function(){});
      await sleep(3000);

      // 고해상도 이미지 URL 찾기
      var result = await page.evaluate(function() {
        var imgs = document.querySelectorAll('img');
        for (var i = 0; i < imgs.length; i++) {
          var src = imgs[i].src || '';
          // Pixabay 썸네일 -> 고해상도 변환
          if (src.indexOf('pixabay.com') >= 0 && src.indexOf('_340') >= 0) {
            return { url: src.replace('_340', '_1280'), found: true };
          }
          if (src.indexOf('pixabay.com') >= 0 && src.indexOf('_640') >= 0) {
            return { url: src.replace('_640', '_1280'), found: true };
          }
        }
        // 배경 이미지 스타일 확인
        var figures = document.querySelectorAll('figure, div[class*="item"]');
        for (var i = 0; i < figures.length; i++) {
          var style = figures[i].getAttribute('style') || '';
          var match = style.match(/url\(['"]?(.*?)['"]?\)/);
          if (match && match[1].indexOf('pixabay.com') >= 0) {
            return { url: match[1].replace('_640', '_1280'), found: true };
          }
        }
        return { found: false };
      });

      if (result.found) {
        var resp = await fetch(result.url);
        if (resp.ok) {
          var buffer = Buffer.from(await resp.arrayBuffer());
          var filepath = dir + filename;
          fs.writeFileSync(filepath, buffer);
          var size = Math.round(buffer.length / 1024);
          console.log('   ✅ ' + size + 'KB');
        } else {
          console.log('   ❌ HTTP ' + resp.status);
        }
      } else {
        console.log('   ❌ 이미지 못 찾음');
      }
    } catch(e) {
      console.log('   ❌ ' + e.message.substring(0, 50));
    }

    await page.close();
    await sleep(2000);
  }

  console.log('\n=== 확보한 사진 ===');
  for (var i = 1; i <= 5; i++) {
    var f = fs.readdirSync(dir).filter(function(x) { return x.indexOf('aicut_photo_') >= 0 && x.indexOf('.jpg') >= 0; });
  }
  var files = fs.readdirSync(dir).filter(function(x) { return x.indexOf('aicut_photo_') >= 0; });
  files.sort();
  files.forEach(function(f) {
    var s = Math.round(fs.statSync(dir + f).size / 1024);
    console.log((files.indexOf(f)+1) + '. ' + f + ' (' + s + 'KB)');
  });

  await b.close();
})();
