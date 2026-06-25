// 최종: 라이브러리 패널로 이미지 삽입 + 저장
const { chromium } = require('playwright');
const fs = require('fs');

function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });

  var pages = ctx.pages();
  var editPage = null;
  for (var i = 0; i < pages.length; i++) {
    if (pages[i].url().indexOf('PostWriteForm') >= 0 && pages[i].url().indexOf('logNo=') >= 0) {
      editPage = pages[i]; break;
    }
  }
  if (!editPage) {
    // 새로 열기
    editPage = await ctx.newPage();
    await editPage.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut&logNo=224319537693', { waitUntil: 'networkidle', timeout: 30000 });
  }

  await editPage.bringToFront();
  await sleep(3000);

  // Upload all 6 images via API and store URLs
  var imgDir = 'C:\\Users\\paul\\.openclaw\\workspace\\';
  var imgFiles = [
    'aicut_blog_edu_01.png', 'aicut_blog_edu_02.png', 'aicut_blog_edu_03.png',
    'aicut_blog_edu_04.png', 'aicut_blog_edu_05.png', 'aicut_blog_edu_06.png'
  ];
  var uploadedUrls = [];

  for (var idx = 0; idx < imgFiles.length; idx++) {
    var imgBase64 = fs.readFileSync(imgDir + imgFiles[idx]).toString('base64');

    var result = await editPage.evaluate(function(data) {
      return new Promise(function(resolve) {
        try {
          var ed = SmartEditor._editors['blogpc001'];
          var ius = ed._videoUploadService._imageUploadService;

          var byteChars = atob(data.base64);
          var byteArrays = [];
          for (var offset = 0; offset < byteChars.length; offset += 512) {
            var slice = byteChars.slice(offset, offset + 512);
            var byteNumbers = new Array(slice.length);
            for (var i = 0; i < slice.length; i++) byteNumbers[i] = slice.charCodeAt(i);
            byteArrays.push(new Uint8Array(byteNumbers));
          }
          var blob = new Blob(byteArrays, { type: 'image/png' });
          var file = new File([blob], data.filename, { type: 'image/png' });

          ius.uploadImages([{ id: 0, source: file }]).then(function(results) {
            results[0].then(function(resp) {
              if (resp.code === 'SUCCESS') {
                resolve({ ok: true, url: resp.response.url });
              } else {
                resolve({ ok: false, error: resp.code });
              }
            });
          });
        } catch(e) {
          resolve({ ok: false, error: e.message });
        }
      });
    }, { base64: imgBase64, filename: imgFiles[idx] });

    if (result.ok) {
      var fullUrl = 'https://blog.naver.com' + result.url;
      uploadedUrls.push(fullUrl);
      console.log('✅ ' + (idx+1) + '/' + imgFiles.length + ' ' + imgFiles[idx]);
    } else {
      console.log('❌ ' + (idx+1) + '/' + imgFiles.length + ' ' + result.error);
    }
    await sleep(2000);
  }

  console.log('\n업로드 완료: ' + uploadedUrls.length + '개');
  console.log('본문에 직접 삽입 시도...');

  // Now insert images into editor content using the contentEditable area
  // Focus the text editor body
  await editPage.mouse.click(700, 500);
  await sleep(1000);

  // 네이버 SE4 이미지 컴포넌트 HTML 형식으로 삽입
  for (var i = 0; i < uploadedUrls.length; i++) {
    var imgTag = '<div class="se-component se-image se-l-default se-section-align-center"><div class="se-component-content"><div class="se-section se-section-image se-l-default"><img src="' + uploadedUrls[i] + '" class="se-image-resource" alt="" data-attachment="' + uploadedUrls[i] + '" data-origin="' + imgFiles[i] + '"></div></div></div><p><br></p>';

    var ok = await editPage.evaluate(function(html) {
      try {
        // Try multiple ways to insert
        document.execCommand('insertHTML', false, html);
        return 'ok';
      } catch(e) {
        try {
          // Fallback: insertAdjacentHTML on the text section
          var section = document.querySelector('.se-section-text .se-module-text p');
          if (section) {
            section.insertAdjacentHTML('afterend', html);
            return 'adjacent';
          }
          return 'no section';
        } catch(e2) {
          return e2.message;
        }
      }
    }, imgTag);

    console.log('  이미지 ' + (i+1) + ': ' + ok);
    await sleep(2000);
  }

  // 저장
  console.log('\n저장 중...');
  await editPage.evaluate(function() {
    var btns = document.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      var t = (btns[i].innerText || '').trim();
      if (t === '저장' && btns[i].offsetParent !== null) { btns[i].click(); return; }
    }
  });
  await sleep(3000);

  // 발행
  console.log('발행 중...');
  await editPage.evaluate(function() {
    var btns = document.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      if ((btns[i].innerText || '').trim() === '발행' && btns[i].offsetParent !== null) {
        btns[i].click(); return;
      }
    }
  });
  await sleep(3000);

  // 발행 확인
  await editPage.evaluate(function() {
    var btns = document.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      if ((btns[i].innerText || '').trim() === '발행' && btns[i].offsetParent !== null) {
        btns[i].click(); return;
      }
    }
  });
  await sleep(5000);

  console.log('URL:', editPage.url().substring(0, 120));
  console.log('\n✅ 완료! 게시물 확인: https://blog.naver.com/aicut/224319537693');
  
  await b.close();
})();
