// 이미지 본문 삽입 - clipboard 방식
const { chromium } = require('playwright');
const fs = require('fs');
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });
  var pages = ctx.pages();
  var bp = null;
  for (var i = 0; i < pages.length; i++) {
    if (pages[i].url().indexOf('PostWriteForm') >= 0) { bp = pages[i]; break; }
  }
  if (!bp) { await b.close(); return; }
  await bp.bringToFront();
  await sleep(2000);

  // 이미지 업로드
  var imgPath = 'C:\\Users\\paul\\.openclaw\\workspace\\aicut_blog_creator_01.png';
  var buf = fs.readFileSync(imgPath);
  var b64 = buf.toString('base64');

  var result = await bp.evaluate(function(data) {
    return new Promise(function(resolve) {
      try {
        var ius = SmartEditor._editors['blogpc001']._videoUploadService._imageUploadService;
        var bc = atob(data.b64);
        var ba = [];
        for (var o = 0; o < bc.length; o += 512) {
          var s = bc.slice(o, o + 512);
          var bn = new Array(s.length);
          for (var i = 0; i < s.length; i++) bn[i] = s.charCodeAt(i);
          ba.push(new Uint8Array(bn));
        }
        var blob = new Blob(ba, { type: 'image/png' });
        var file = new File([blob], 'aicut_blog_creator_01.png', { type: 'image/png' });
        ius.uploadImages([{ id: 0, source: file }]).then(function(results) {
          results[0].then(function(resp) {
            if (resp.code === 'SUCCESS') resolve({ ok: true, url: 'https://blog.naver.com' + resp.response.url });
            else resolve({ ok: false });
          });
        });
      } catch(e) { resolve({ ok: false }); }
    });
  }, { b64: b64 });

  if (!result.ok) { console.log('업로드 실패'); await b.close(); return; }
  console.log('이미지 업로드 ✅');

  // 이미지 HTML만 클립보드에 복사
  var imgHtml = '<div class="se-component se-image se-l-default se-section-align-center"><div class="se-component-content"><div class="se-section se-section-image se-l-default"><img src="' + result.url + '" class="se-image-resource" alt=""></div></div></div><p><br></p>';

  var clipOk = await bp.evaluate(function(html) {
    return new Promise(function(resolve) {
      try {
        var blob = new Blob([html], { type: 'text/html' });
        navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })]).then(function() { resolve(true); }).catch(function() { resolve(false); });
      } catch(e) { resolve(false); }
    });
  }, imgHtml);

  if (clipOk) {
    // 에디터 끝으로 이동
    await bp.evaluate(function() {
      var ed = SmartEditor._editors['blogpc001'];
      if (ed.focusFirstText) ed.focusFirstText();
    });
    await sleep(500);
    // Tab 키로 끝까지 이동 후 붙여넣기
    await bp.keyboard.press('End');
    await sleep(300);
    await bp.keyboard.press('Enter');
    await sleep(300);
    await bp.keyboard.press('Control+v');
    await sleep(3000);
    console.log('이미지 붙여넣기 ✅');

    // 저장
    await bp.evaluate(function() {
      var btns = document.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        if ((btns[i].innerText || '').trim() === '저장' && btns[i].offsetParent !== null) {
          btns[i].click(); return;
        }
      }
    });
    await sleep(2000);
    console.log('저장 ✅');
  }

  await b.close();
})();
