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
  
  // === 팝업 처리 ===
  const popupResult = await p.evaluate(() => {
    // "이어서 작성" 팝업 처리
    const popup = document.querySelector('.se-popup-container.__se-pop-layer');
    if (popup) {
      // "이어서 작성" 버튼 찾기
      const buttons = popup.querySelectorAll('button');
      const btnTexts = Array.from(buttons).map(b => b.innerText.trim());
      console.log('팝업 버튼:', btnTexts);
      // '새로 작성' 버튼 클릭 (기존 내용 무시)
      const newBtn = Array.from(buttons).find(b => b.innerText.includes('새로 작성'));
      if (newBtn) { newBtn.click(); return '새로 작성 클릭'; }
      return '버튼 없음';
    }
    return '팝업 없음';
  });
  console.log('팝업:', popupResult);
  await p.waitForTimeout(2000);
  
  // === 1. 제목 입력 ===
  console.log('📝 제목 입력...');
  const titleOk = await p.evaluate((title) => {
    try {
      SmartEditor._editors['blogpc001'].setDocumentTitle(title);
      return '✅ ' + SmartEditor._editors['blogpc001'].getDocumentTitle();
    } catch (e) {
      return '❌ ' + e.message;
    }
  }, TITLE);
  console.log('  결과:', titleOk);
  
  // === 2. 본문 입력 — setDocumentData 구조 확인 ===
  console.log('🔍 setDocumentData 파라미터 확인...');
  const docInfo = await p.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const doc = ed._document;
    
    // document 속성 확인
    const docData = ed._documentService._documentDataStore;
    
    return {
      docDataKeys: docData ? Object.keys(docData).slice(0,20) : null,
      documentKeys: Object.keys(doc).slice(0,20),
      docStr: JSON.stringify(doc).slice(0,300),
    };
  });
  console.log('문서 정보:', JSON.stringify(docInfo, null, 2));
  
  // === 3. 에디터 본문 영역 직접 조작 ===
  console.log('✏️ 본문 영역 직접 입력 시도...');
  
  // 제목 아래 본문 영역 찾기
  const bodyHTML = buildBodyHTML();
  
  // 클립보드에 복사
  await p.evaluate((html) => {
    return navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()], { type: 'text/plain' })
      })
    ]);
  }, bodyHTML);
  console.log('  📋 클립보드 복사 완료');
  await p.waitForTimeout(500);
  
  // 본문 영역 클릭 후 붙여넣기
  const pasteResult = await p.evaluate(() => {
    // SE4 본문 영역 찾기 (se-text 컴포넌트 내부)
    const textComp = document.querySelector('.se-component.se-text .se-component-content');
    if (!textComp) return '❌ .se-component.se-text 없음';
    
    // contenteditable 찾기
    const ce = textComp.querySelector('[contenteditable]') || textComp;
    if (!ce) return '❌ contenteditable 없음';
    
    ce.focus();
    
    // 내용 전체 선택 후 삭제
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(ce);
    sel.removeAllRanges();
    sel.addRange(range);
    
    return '✅ focused on text component';
  });
  console.log('  본문 포커스:', pasteResult);
  
  await p.waitForTimeout(300);
  
  // Ctrl+V 키 누르기
  await p.keyboard.press('Control+V');
  console.log('  ⌨️ Ctrl+V 전송');
  
  await p.waitForTimeout(5000);
  
  // 결과 확인
  const contentResult = await p.evaluate(() => {
    const seContent = document.querySelector('.se-content.__se-scroll-target');
    if (seContent) {
      return {
        text: (seContent.innerText || '').slice(0, 500),
        htmlLen: seContent.innerHTML.length,
      };
    }
    return 'no .se-content';
  });
  console.log('📊 본문 결과:', JSON.stringify(contentResult, null, 2));
  
  // === 4. 스크린샷 ===
  await p.screenshot({ path: 'debug_final.png', fullPage: true });
  console.log('✅ 스크린샷: debug_final.png');
  
  // === 5. 저장 ===
  console.log('💾 저장...');
  const saveResult = await p.evaluate(() => {
    const saveBtn = document.querySelector('.save_btn__bzc5B');
    if (saveBtn) { saveBtn.click(); return '✅ 저장 클릭'; }
    return '❌ 저장 버튼 없음';
  });
  console.log(' ', saveResult);
  
  await p.waitForTimeout(3000);
  
  console.log('\n✅ 작업 완료! 브라우저 확인 바랍니다.');
  
  await b.close();
}

main().catch(e => console.error('❌ 오류:', e.message));
