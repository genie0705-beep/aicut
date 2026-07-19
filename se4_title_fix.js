const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  const wp = pages.find(p => p.url().includes('Redirect=Write'));
  if (!wp) { console.log('NO PAGE'); await b.close(); return; }
  await wp.bringToFront(); await sleep(2000);
  
  const frames = wp.frames();
  let se = null;
  for (const f of frames) {
    if (await f.evaluate(() => typeof SmartEditor !== 'undefined' && !!SmartEditor._editors).catch(() => false)) { se = f; break; }
  }
  if (!se) { console.log('NO SE'); await b.close(); return; }
  
  console.log('✅ SE 프레임');
  
  // 1. 제목 설정 (API + DOM 직접 설정)
  await se.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    
    // API로 제목 설정
    ed.setDocumentTitle('중복 보양식, 인증샷부터 음식 릴스까지');
    
    // DOM에서 제목 입력 필드를 찾아서 직접 값 설정
    const titleEl = document.querySelector('[contenteditable][_placeholder*="제목"]') ||
                    document.querySelector('[contenteditable].se-title') ||
                    document.querySelector('.se-documentTitle-editable') ||
                    document.querySelector('[class*=documentTitle] [contenteditable]');
    
    if (titleEl) {
      titleEl.innerText = '중복 보양식, 인증샷부터 음식 릴스까지';
      // React 인식용 input 이벤트
      titleEl.dispatchEvent(new Event('input', { bubbles: true }));
      console.log('DOM 제목 필드 설정 완료');
    } else {
      console.log('DOM 제목 필드 못 찾음');
    }
  });
  await sleep(1000);
  
  // 제목 영역 HTML 분석
  const titleInfo = await se.evaluate(() => {
    const all = document.querySelectorAll('[contenteditable]');
    const info = Array.from(all).map(el => ({
      tag: el.tagName,
      cls: el.className.substring(0, 40),
      id: el.id,
      placeholder: el.getAttribute('_placeholder') || el.getAttribute('placeholder') || '',
      text: el.innerText.substring(0, 30)
    }));
    return info;
  });
  
  console.log('\n제목 입력 필드 검색:');
  let titleFound = false;
  titleInfo.forEach((t, i) => {
    console.log('  [' + i + '] ' + t.tag + ' cls=' + t.cls + ' place=' + t.placeholder + ' text="' + t.text + '"');
    if (t.placeholder.includes('제목') || t.cls.includes('title') || t.cls.includes('Title')) {
      titleFound = true;
    }
  });
  
  if (!titleFound) {
    // focusTitle로 제목 영역 활성화 후 설정
    console.log('\nfocusTitle() 호출 후 재시도');
    await se.evaluate(() => {
      const ed = SmartEditor._editors['blogpc001'];
      ed.focusTitle();
    });
    await sleep(1000);
    
    await se.evaluate(() => {
      const all = document.querySelectorAll('[contenteditable]');
      for (const el of all) {
        const p = el.getAttribute('_placeholder') || '';
        if (p.includes('제목')) {
          el.innerText = '중복 보양식, 인증샷부터 음식 릴스까지';
          el.dispatchEvent(new Event('input', { bubbles: true }));
          return;
        }
      }
      // focusTitle 후 생긴 새 요소 확인
      const newEditables = document.querySelectorAll('[contenteditable]');
      console.log('focusTitle 후 editable 수:', newEditables.length);
    });
    await sleep(1000);
  }
  
  // 저장
  await se.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) { if (btn.innerText.trim() === '저장') { btn.click(); return; } }
  });
  await sleep(5000);
  
  // 최종 확인
  const v = await se.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const canvas = document.querySelector('.se-canvas');
    const text = canvas ? canvas.innerText : '';
    const titleFromApi = ed.getDocumentTitle();
    
    // DOM에서 제목 찾기
    let titleFromDom = '';
    const all = document.querySelectorAll('[contenteditable]');
    for (const el of all) {
      const p = el.getAttribute('_placeholder') || '';
      if (p.includes('제목')) {
        titleFromDom = el.innerText;
        break;
      }
    }
    
    return {
      apiTitle: titleFromApi,
      domTitle: titleFromDom || '못 찾음',
      textLen: text.replace(/\s/g, '').length
    };
  });
  
  console.log('\n=== ✅ 최종 확인 ===');
  console.log('API 제목:', v.apiTitle);
  console.log('DOM 제목:', v.domTitle);
  console.log('본문:', v.textLen + '자');
  console.log('');
  console.log(v.domTitle.includes('중복') ? '✅ DOM 제목 정상!' : '⚠️ DOM 제목 없음');
  
  await b.close();
})();
