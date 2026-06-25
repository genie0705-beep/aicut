// 사진을 700x700 정사각형으로 변환
const { chromium } = require('playwright');
const fs = require('fs');
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];

  var dir = 'C:\\Users\\paul\\.openclaw\\workspace\\';
  var sources = [
    { file: 'aicut_photo_editing_2.jpg', out: 'aicut_photo_square_1.jpg' },
    { file: 'aicut_photo_creator_3.jpg', out: 'aicut_photo_square_2.jpg' },
    { file: 'aicut_photo_camera_4.jpg', out: 'aicut_photo_square_3.jpg' },
    { file: 'aicut_photo_office_5.jpg', out: 'aicut_photo_square_4.jpg' },
  ];

  for (var s = 0; s < sources.length; s++) {
    var page = await ctx.newPage();
    var inputPath = dir + sources[s].file;
    var outputPath = dir + sources[s].out;
    var imgBuffer = fs.readFileSync(inputPath);
    var base64 = imgBuffer.toString('base64');

    console.log('[' + (s+1) + '/4] ' + sources[s].out);

    var result = await page.evaluate(function(data) {
      return new Promise(function(resolve) {
        var img = new Image();
        img.onload = function() {
          // 700x700 정사각형으로 크롭 (중앙 기준)
          var canvas = document.createElement('canvas');
          canvas.width = 700;
          canvas.height = 700;
          var ctx = canvas.getContext('2d');

          var size = Math.min(img.width, img.height);
          var sx = (img.width - size) / 2;
          var sy = (img.height - size) / 2;

          ctx.drawImage(img, sx, sy, size, size, 0, 0, 700, 700);
          resolve(canvas.toDataURL('image/jpeg', 0.9));
        };
        img.onerror = function() { resolve(null); };
        img.src = 'data:' + data.mime + ';base64,' + data.b64;
      });
    }, { b64: base64, mime: 'image/jpeg' });

    if (result) {
      var base64Data = result.replace(/^data:image\/jpeg;base64,/, '');
      var buf = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(outputPath, buf);
      var size = Math.round(buf.length / 1024);
      console.log('   ✅ 700x700 정사각형 (' + size + 'KB)');
    } else {
      console.log('   ❌ 변환 실패');
    }

    await page.close();
  }

  console.log('\n=== 최종 확보 사진 ===');
  var files = fs.readdirSync(dir).filter(function(f) { return f.indexOf('aicut_photo_square') >= 0; });
  files.sort();
  files.forEach(function(f) {
    var s = Math.round(fs.statSync(dir + f).size / 1024);
    console.log((files.indexOf(f)+1) + '. ' + f + ' (' + s + 'KB)');
  });

  await b.close();
})();
