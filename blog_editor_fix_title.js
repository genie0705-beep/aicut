// 제목 정확한 위치에 입력 + 잘못된 input 정리
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];

  let pwFrame = null;
  for (const p of ctx.pages()) {
    for (const f of p.frames()) {
      if (f.url().includes('PostWriteForm')) {
        pwFrame = f;
        break;
      }
    }
    if (pwFrame) break;
  }

  if (!pwFrame) {
    console.log('❌ 에디터 못 찾음');
    try { await b.close(); } catch(e) {}
    process.exit(1);
  }

  // 1. 글감 검색 input 비우기
  await pwFrame.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    for (const inp of inputs) {
      if (inp.placeholder && inp.placeholder.includes('글감')) {
        const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        s.call(inp, '');
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('글감 검색 input 초기화');
      }
    }
  });

  // 2. SE 에디터의 제목 영역 찾기 (contenteditable)
  const title = '병원 마케팅, 영상이 필요한 3가지 이유';
  
  const result = await pwFrame.evaluate((t) => {
    // 방법 1: se-documentTitle
    const titleEl = document.querySelector('.se-documentTitle, .se-title-text');
    if (titleEl && titleEl.isContentEditable) {
      titleEl.focus();
      titleEl.innerText = t;
      titleEl.dispatchEvent(new Event('input', { bubbles: true }));
      return 'se-documentTitle입력완료';
    }
    
    // 방법 2: h2[contenteditable] (네이버 구형)
    const h2s = document.querySelectorAll('h2[contenteditable]');
    if (h2s.length > 0) {
      h2s[0].innerText = t;
      h2s[0].dispatchEvent(new Event('input', { bubbles: true }));
      return 'h2입력완료';
    }

    // 방법 3: 모든 contenteditable 중 가장 위에 있는 요소
    const eds = document.querySelectorAll('[contenteditable]');
    if (eds.length > 0) {
      // 첫 번째 contenteditable이 제목 영역 (본문은 그 아래)
      eds[0].focus();
      eds[0].innerText = t;
      eds[0].dispatchEvent(new Event('input', { bubbles: true }));
      return '첫번째contenteditable입력완료 (' + (eds[0].className || '클래스없음') + ')';
    }
    
    return '제목영역못찾음';
  }, title);
  
  console.log('제목 재입력:', result);

  await pwFrame.waitForTimeout(1000);

  // 확인
  const check = await pwFrame.evaluate(() => {
    return Array.from(document.querySelectorAll('[contenteditable]')).map(el => ({
      cls: (el.className || '').substring(0, 50),
      text: (el.innerText || '').substring(0, 40),
      len: (el.innerText || '').length
    }));
  });
  console.log('📝 확인:', JSON.stringify(check, null, 2));

  try { await b.close(); } catch(e) {}
  console.log('\n✅ 수정 완료! 브라우저에서 확인해주세요.');
})();
