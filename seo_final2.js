const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  
  var page = await ctx.newPage();
  await page.setViewportSize({ width: 1400, height: 1000 });

  // 권한 부여
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Browser.grantPermissions', {
    permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'],
  });

  await page.goto('https://blog.naver.com/aicut/postwrite', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await sleep(4000);

  // 제목
  await page.evaluate(function() {
    SmartEditor._editors['blogpc001'].setDocumentTitle('스마트스토어 숏폼 마케팅, 직원 1명 없이 월 30편으로 매출 2배 올린 방법');
  });
  console.log('✅ 제목');
  await sleep(500);

  // HTML 읽기
  var bodyHTML = fs.readFileSync(path.join(__dirname, 'seo_body.html'), 'utf8');

  // 방법 1: execCommand('insertHTML') - 레거시지만 React가 인식함
  console.log('1. execCommand 시도...');
  var result1 = await page.evaluate(function(html) {
    try {
      var ed = document.querySelector('[contenteditable]');
      if (!ed) return 'editable 없음';
      ed.focus();
      ed.innerHTML = '';
      var success = document.execCommand('insertHTML', false, html);
      return success ? 'execCommand 성공' : 'execCommand 실패';
    } catch(e) { return '오류: ' + e.message.substring(0, 40); }
  }, bodyHTML);
  console.log('  ' + result1);
  await sleep(2000);

  var check1 = await page.evaluate(function() {
    var ed = SmartEditor._editors['blogpc001'];
    var text = ed.getContentText ? ed.getContentText() : '';
    return { len: text.length, preview: text.substring(0, 30) };
  });
  console.log('  확인: ' + JSON.stringify(check1));

  // 방법 2: contenteditable.innerHTML 직접 설정 + input/compositionend 이벤트
  if (!check1.len || check1.len < 100) {
    console.log('2. innerHTML + 이벤트 시도...');
    await page.evaluate(function(html) {
      var ed = document.querySelector('[contenteditable]');
      if (!ed) return;
      ed.focus();
      ed.innerHTML = html;
      // 다양한 이벤트로 React 깨우기
      ed.dispatchEvent(new Event('input', { bubbles: true }));
      ed.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '' }));
      
      // keyup 이벤트도 추가
      var ke = new KeyboardEvent('keyup', { key: 'Enter', bubbles: true });
      ed.dispatchEvent(ke);
      
      // 포커스 잃었다가 다시 얻기
      ed.blur();
      setTimeout(function() { ed.focus(); }, 100);
    }, bodyHTML);
    await sleep(2000);

    var check2 = await page.evaluate(function() {
      var ed = SmartEditor._editors['blogpc001'];
      var text = ed.getContentText ? ed.getContentText() : '';
      return { len: text.length, preview: text.substring(0, 30) };
    });
    console.log('  확인: ' + JSON.stringify(check2));
  }

  // 방법 3: clipboard 권한 부여 후 다시 시도
  var finalCheck = await page.evaluate(function() {
    var ed = SmartEditor._editors['blogpc001'];
    var text = ed.getContentText ? ed.getContentText() : '';
    return { len: text.length };
  });

  if (finalCheck.len > 100) {
    console.log('\n✅ 본문 확인됨! 저장 중...');
    await page.evaluate(function() {
      var btns = document.querySelectorAll('button');
      for (var b of btns) {
        if (b.textContent.trim() === '저장') { b.click(); return; }
      }
    });
    console.log('✅ 저장 완료!');
  } else {
    console.log('\n❌ 본문 미입력. 저장된 파일 확인: seo_body.html');
    // 탭은 열어둠
  }

  await sleep(2000);
  console.log('\n🎉 완료');
  await b.close();
})().catch(e => console.error('❌', e.message));
