// AI 사진 3장 생성 (Craiyon)
const { chromium } = require('playwright');
const fs = require('fs');
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });

  var dir = 'C:\\Users\\paul\\.openclaw\\workspace\\';
  var prompts = [
    'youtuber recording video in modern studio professional lighting photorealistic',
    'video editor working at computer screen creative office space',
    'content creator filming with smartphone cozy workspace'
  ];
  var filenames = [
    'aicut_ai_photo_1.jpg',
    'aicut_ai_photo_2.jpg',
    'aicut_ai_photo_3.jpg'
  ];

  for (var i = 0; i < prompts.length; i++) {
    console.log('[' + (i+1) + '/3] 생성 중...');
    var page = await ctx.newPage();
    await page.goto('https://www.craiyon.com/en', { waitUntil: 'networkidle', timeout: 20000 }).catch(function(){});
    await sleep(3000);

    // 텍스트 입력창에 프롬프트 입력
    var inputEl = await page.$('input, textarea');
    if (inputEl) {
      await inputEl.fill(prompts[i]);
      console.log('   입력 ✅');
    } else {
      // contenteditable 시도
      await page.evaluate(function(prompt) {
        var el = document.querySelector('[contenteditable]');
        if (el) { el.innerText = prompt; el.dispatchEvent(new Event('input', { bubbles: true })); }
      }, prompts[i]);
      console.log('   입력 (contenteditable) ✅');
    }
    await sleep(1000);

    // Draw 또는 생성 버튼 찾기
    var btnClicked = await page.evaluate(function() {
      var all = document.querySelectorAll('button, a, span');
      for (var i = 0; i < all.length; i++) {
        var t = (all[i].innerText || '').trim().toLowerCase();
        if ((t === 'draw' || t.indexOf('create') >= 0 || t.indexOf('generate') >= 0) && all[i].offsetParent !== null) {
          all[i].click();
          return true;
        }
      }
      return false;
    });
    console.log('   생성 버튼:', btnClicked ? '✅' : '❌');
    
    // 생성 완료 대기 (최대 60초)
    console.log('   생성 대기 중...');
    var found = false;
    for (var w = 0; w < 30; w++) {
      await sleep(2000);
      var done = await page.evaluate(function() {
        // 생성 완료 후 나타나는 이미지 확인
        var imgs = document.querySelectorAll('img[src*=\"blob:\"], img[src*=\"data:\"]');
        for (var i = 0; i < imgs.length; i++) {
          if (imgs[i].naturalWidth > 100) {
            return { ok: true, src: imgs[i].src.substring(0, 50) };
          }
        }
        // 로딩 텍스트 확인
        var body = document.body.innerText;
        if (body.indexOf('remaining') < 0 && body.indexOf('credit') < 0) {
          // 생성 완료 신호
        }
        return { ok: false };
      });
      if (done.ok) {
        found = true;
        console.log('   ✅ 생성 완료!');
        
        // 생성된 첫 번째 이미지 다운로드
        var imgSrc = done.src;
        // blob URL은 evaluate에서 가져올 수 없어서 canvas로 추출
        var imgData = await page.evaluate(function() {
          var imgs = document.querySelectorAll('img');
          for (var i = 0; i < imgs.length; i++) {
            if (imgs[i].naturalWidth > 100) {
              var c = document.createElement('canvas');
              c.width = imgs[i].naturalWidth;
              c.height = imgs[i].naturalHeight;
              var ctx = c.getContext('2d');
              ctx.drawImage(imgs[i], 0, 0);
              return c.toDataURL('image/jpeg', 0.9);
            }
          }
          return null;
        });
        
        if (imgData) {
          var b64 = imgData.replace(/^data:image\/jpeg;base64,/, '');
          var buf = Buffer.from(b64, 'base64');
          fs.writeFileSync(dir + filenames[i], buf);
          console.log('   💾 저장:', filenames[i], '(' + Math.round(buf.length/1024) + 'KB)');
          
          // 정사각형으로 크롭
          var cropped = await page.evaluate(function(data) {
            return new Promise(function(resolve) {
              var img = new Image();
              img.onload = function() {
                var c = document.createElement('canvas');
                c.width = 500;
                c.height = 500;
                var ctx = c.getContext('2d');
                var size = Math.min(img.width, img.height);
                var sx = (img.width - size) / 2;
                var sy = (img.height - size) / 2;
                ctx.drawImage(img, sx, sy, size, size, 0, 0, 500, 500);
                resolve(c.toDataURL('image/jpeg', 0.9));
              };
              img.src = 'data:image/jpeg;base64,' + data.b64;
            });
          }, { b64: b64 });
          
          if (cropped) {
            var cb64 = cropped.replace(/^data:image\/jpeg;base64,/, '');
            var cbuf = Buffer.from(cb64, 'base64');
            var squareFile = filenames[i].replace('.jpg', '_square.jpg');
            fs.writeFileSync(dir + squareFile, cbuf);
            console.log('   💾 정사각형:', squareFile, '(' + Math.round(cbuf.length/1024) + 'KB)');
          }
        }
        break;
      }
    }
    if (!found) console.log('   ❌ 생성 실패/시간초과');

    await page.close();
    await sleep(2000);
  }

  // 결과
  console.log('\n=== 생성된 AI 사진 ===');
  var files = fs.readdirSync(dir).filter(function(f) { return f.indexOf('aicut_ai_photo') >= 0; });
  files.sort();
  files.forEach(function(f) {
    var s = Math.round(fs.statSync(dir + f).size / 1024);
    console.log((files.indexOf(f)+1) + '. ' + f + ' (' + s + 'KB)');
  });

  await b.close();
})();
