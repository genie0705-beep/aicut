const { chromium } = require('playwright');
const { TITLE, buildBodyHTML } = require('./_blog_realestate_content.js');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const p = await ctx.newPage();
  
  await p.goto('https://blog.naver.com/aicut/postwrite', {
    waitUntil: 'networkidle',
    timeout: 30000
  });
  await p.waitForTimeout(5000);
  
  // === 1. 제목 입력 ===
  console.log('📝 제목 입력...');
  const titleOk = await p.evaluate((title) => {
    try {
      SmartEditor._editors['blogpc001'].setDocumentTitle(title);
      const t = SmartEditor._editors['blogpc001'].getDocumentTitle();
      return t === title;
    } catch (e) {
      return '오류: ' + e.message;
    }
  }, TITLE);
  console.log('  제목:', titleOk === true ? '✅' : '❌ ' + titleOk);
  
  // === 2. 클립보드에 본문 HTML 복사 ===
  console.log('📋 본문 HTML 클립보드 복사...');
  const bodyHTML = buildBodyHTML();
  
  const copyOk = await p.evaluate((html) => {
    return new Promise((resolve) => {
      const blob = new Blob([html], { type: 'text/html' });
      const textPlain = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const blobText = new Blob([textPlain], { type: 'text/plain' });
      
      navigator.clipboard.write([
        new ClipboardItem({
          'text/html': blob,
          'text/plain': blobText
        })
      ]).then(() => resolve(true))
      .catch(e => resolve('오류: ' + e.message));
    });
  }, bodyHTML);
  console.log('  클립보드:', copyOk === true ? '✅' : '❌ ' + copyOk);
  
  await p.waitForTimeout(500);
  
  // === 3. contenteditable 영역 찾아 Ctrl+V ===
  console.log('⌨️ Ctrl+V 붙여넣기...');
  const pasteOk = await p.evaluate(() => {
    const ce = document.querySelector('[contenteditable]');
    if (!ce) return '❌ contenteditable 없음';
    
    ce.focus();
    // 전체 선택 후 삭제 (기존 내용 제거)
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(ce);
    sel.removeAllRanges();
    sel.addRange(range);
    
    return '✅ focused, ready for paste';
  });
  console.log('  ', pasteOk);
  
  await p.waitForTimeout(300);
  
  // 실제 Ctrl+V (Playwright keyboard)
  await p.keyboard.press('Control+V');
  
  console.log('⏳ 붙여넣기 완료 대기...');
  await p.waitForTimeout(5000);
  
  // === 4. 결과 확인 ===
  const result = await p.evaluate(() => {
    const ce = document.querySelector('[contenteditable]');
    if (!ce) return { error: 'no ce' };
    return {
      innerHTML_length: ce.innerHTML.length,
      innerHTML_sample: ce.innerHTML.slice(0, 300),
      text_length: (ce.innerText || '').length,
    };
  });
  console.log('📊 붙여넣기 결과:', JSON.stringify(result, null, 2));
  
  await p.screenshot({ path: 'debug_paste_result.png', fullPage: true });
  console.log('✅ 스크린샷: debug_paste_result.png');
  
  // === 5. 저장 버튼 클릭 ===
  console.log('💾 저장 시도...');
  const saveOk = await p.evaluate(() => {
    const saveBtn = document.querySelector('.save_btn__bzc5B');
    if (saveBtn) {
      saveBtn.click();
      return '✅ 저장 버튼 클릭됨';
    }
    return '❌ 저장 버튼 없음 (.save_btn__bzc5B)';
  });
  console.log(' ', saveOk);
  
  await p.waitForTimeout(3000);
  
  console.log('\n✅ 작업 완료! 브라우저를 확인해주세요.');
  
  await b.disconnect();
}

main().catch(e => console.error('❌ 오류:', e.message));
