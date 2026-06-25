const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const CDP_PORT = 9224;
const CONTENT = require('./blog_post_commute.js');

function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }
function p(text) { return '<p style="text-align: center;">' + text + '</p>'; }
function br() { return '<p><br></p>'; }

const IMAGES = [
  'aicut_commute_thumb.png',
  'aicut_commute_check.png',
  'aicut_commute_routine.png',
  'aicut_commute_ai.png',
  'aicut_commute_cta.png'
];

(async () => {
  console.log('=== 블로그 작성 (출근길30분) ===\n');
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  // 1. 에디터 열기
  console.log('1. 에디터 열기...');
  await page.goto('https://blog.naver.com/PostWriteForm.nhn?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(3000);

  // 2. 제목
  console.log('2. 제목 설정...');
  var titleOk = await page.evaluate(function(title) {
    try {
      if (typeof SmartEditor !== 'undefined' && SmartEditor._editors && SmartEditor._editors['blogpc001']) {
        SmartEditor._editors['blogpc001'].setDocumentTitle(title);
        return true;
      }
    } catch(e) {}
    return false;
  }, CONTENT.title);
  console.log('   제목:', titleOk ? '✅' : '❌');

  // 3. 본문 HTML
  var bodyLines = CONTENT.body.split('\n');
  var htmlParts = [];
  for (var i = 0; i < bodyLines.length; i++) {
    var line = bodyLines[i];
    if (line === '') { htmlParts.push(br()); }
    else if (line.startsWith('#')) { htmlParts.push(p(line)); }
    else { htmlParts.push(p(line)); }
  }
  var html = htmlParts.join('\n');

  // 4. 본문 붙여넣기
  console.log('3. 본문 붙여넣기...');
  var clipOk = await page.evaluate(function(html) {
    return new Promise(function(resolve) {
      try {
        var blob = new Blob([html], { type: 'text/html' });
        navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })]);
        resolve(true);
      } catch(e) { resolve(false); }
    });
  }, html);

  if (clipOk) {
    await page.evaluate(function() {
      try {
        var ed = SmartEditor._editors['blogpc001'];
        ed.focus();
      } catch(e) {}
      var ce = document.querySelector('[contenteditable]');
      if (ce) { ce.focus(); var r = document.createRange(); r.selectNodeContents(ce); r.collapse(false); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); }
    });
    await sleep(1000);
    await page.keyboard.press('Control+v');
    await sleep(5000);

    var len = await page.evaluate(function() {
      try { return SmartEditor._editors['blogpc001'].getContentText().length; } catch(e) { return 0; }
    });
    console.log('   본문:', len > 500 ? '✅ ' + len + '자' : '⚠️ ' + len + '자');
  }

  // 5. 이미지 등록 (clipboard 방식)
  console.log('4. 이미지 등록...');
  var imgOk = 0;

  for (var i = 0; i < IMAGES.length; i++) {
    var imgName = IMAGES[i];
    var imgPath = path.join(__dirname, imgName);
    if (!fs.existsSync(imgPath)) { console.log('   [' + (i+1) + '/' + IMAGES.length + '] ' + imgName + ' 파일 없음'); continue; }

    var imgBuf = fs.readFileSync(imgPath);
    var b64 = imgBuf.toString('base64');

    var imgClipOk = await page.evaluate(function(b64img) {
      return new Promise(function(resolve) {
        try {
          var binary = atob(b64img);
          var arr = new Uint8Array(binary.length);
          for (var i = 0; i < binary.length; i++) { arr[i] = binary.charCodeAt(i); }
          var blob = new Blob([arr], { type: 'image/png' });
          navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          resolve(true);
        } catch(e) { resolve(false); }
      });
    }, b64);

    if (imgClipOk) {
      // 에디터 포커스 + 커서 끝으로
      await page.evaluate(function() {
        var ce = document.querySelector('[contenteditable]');
        if (ce) { ce.focus(); var r = document.createRange(); r.selectNodeContents(ce); r.collapse(false); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); }
      });
      await sleep(500);
      await page.keyboard.press('Control+v');
      await sleep(3000);
      console.log('   [' + (i+1) + '/' + IMAGES.length + '] ' + imgName + ' ✅');
      imgOk++;
    } else {
      console.log('   [' + (i+1) + '/' + IMAGES.length + '] ' + imgName + ' ❌');
    }
  }
  console.log('   이미지 등록: ' + imgOk + '/' + IMAGES.length);

  // 6. 저장
  console.log('5. 저장...');
  var saved = false;
  for (var a = 0; a < 5; a++) {
    saved = await page.evaluate(function() {
      var btns = document.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        if ((btns[i].innerText || '').trim() === '저장' && btns[i].offsetParent !== null) {
          btns[i].click(); return true;
        }
      }
      return false;
    });
    if (saved) break;
    await sleep(1000);
  }
  console.log('   저장:', saved ? '✅' : '❌');
  await sleep(3000);

  // 7. 확인
  var toast = await page.evaluate(function() {
    var els = document.querySelectorAll('[class*=toast], [class*=Toast], [role=alert]');
    return Array.from(els).map(function(e) { return e.innerText.substring(0, 50); }).join(' | ') || '알림 없음';
  });
  console.log('   알림:', toast);

  console.log('\n=== 완료 ===');
  console.log('   제목:', CONTENT.title.substring(0, 40) + '...');
  console.log('   제목 등록:', titleOk ? '✅' : '❌');
  console.log('   본문 등록:', clipOk ? '✅' : '❌');
  console.log('   이미지 등록:', imgOk + '/' + IMAGES.length);
  console.log('   저장:', saved ? '✅' : '❌');

  await b.close();
})();
