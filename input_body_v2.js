const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fs = require('fs');
const path = require('path');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  const posts = [
    { file: 'aicut_blog_baseball.html', label: '⚾ 프로야구', idx: 0 },
    { file: 'aicut_blog_rainy.html', label: '🌧 장맛비', idx: 1 },
  ];

  for (const post of posts) {
    // PostWriteForm 있는 탭 찾기 (첫 번째/두 번째 구분)
    let tab = null;
    let count = 0;
    for (const p of ctx.pages()) {
      if (p.frames().some(f => f.url().includes('PostWriteForm'))) {
        if (count === post.idx) { tab = p; break; }
        count++;
      }
    }
    if (!tab) { console.log(`${post.label} 탭 없음`); continue; }

    await tab.bringToFront();
    await sleep(2000);
    const f = tab.frames().find(ff => ff.url().includes('PostWriteForm'));

    console.log(`\n━━━ ${post.label} ━━━`);

    // 방법 1: contentEditable에 직접 HTML 삽입
    const r1 = await f.evaluate(() => {
      try {
        // SE1 에디터의 본문 영역 찾기
        const all = document.querySelectorAll('*');
        for (const el of all) {
          if (el.isContentEditable && el.offsetParent !== null && el.textContent.trim() === '') {
            return '✅ contentEditable 찾음: ' + (el.id || el.tagName);
          }
        }
        // visible contentEditable 모두 확인
        const editables = [];
        for (const el of all) {
          if (el.isContentEditable && el.offsetParent !== null) {
            editables.push(el.id || el.tagName + ' | text: "' + el.textContent.trim().substring(0, 20) + '"');
          }
        }
        return 'contentEditables: ' + JSON.stringify(editables);
      } catch(e) { return '❌ ' + e.message; }
    });
    console.log(`  ${r1}`);

    // 방법 2: setDocumentData 실패 이유 분석
    const r2 = await f.evaluate(() => {
      try {
        const ed = SmartEditor._editors?.blogpc001;
        if (!ed) return 'ed 없음';
        
        const ds = ed._documentService;
        if (!ds) return '_documentService 없음';
        
        // getDocumentData로 현재 상태 확인
        const current = ds.getDocumentData?.() || '';
        
        // setDocumentData의 toString 확인
        const funcStr = ds.setDocumentData.toString();
        
        return { currentLen: current.length, funcStr: funcStr.substring(0, 200) };
      } catch(e) { return '❌ ' + e.message; }
    });
    console.log(`  documentService: ${JSON.stringify(r2).substring(0, 200)}`);

    // 방법 3: execCommand로 직접 HTML 삽입
    const htmlContent = fs.readFileSync(path.join(__dirname, post.file), 'utf-8');
    
    // HTML을 줄 단위로 나눠서 하나씩 삽입
    const htmlLines = htmlContent.match(/<[^>]+>[^<]*/g) || [];
    console.log(`  HTML 요소: ${htmlLines.length}개`);

    // navigator clipboard에 HTML 쓰기
    const r3 = await f.evaluate(() => {
      return typeof navigator?.clipboard?.write === 'function' ? 'clipboard API 있음' : 'clipboard API 없음';
    });
    console.log(`  ${r3}`);

    // 직접 paste 이벤트 시도 (body에 직접)
    const r4 = await f.evaluate(() => {
      try {
        // 에디터 본문 영역 찾기 (내부 div)
        const editAreas = document.querySelectorAll('[class*="edit"], [class*="editor"], [class*="content"]');
        for (const el of editAreas) {
          if (el.isContentEditable && el.offsetParent !== null) {
            el.focus();
            el.innerHTML = '<p>테스트 본문입니다. 에디터가 정상 동작합니다.</p>';
            return 'innerHTML 직접 설정: ' + (el.id || el.className.substring(0, 30));
          }
        }
        return 'editArea 없음';
      } catch(e) { return '❌ ' + e.message; }
    });
    console.log(`  ${r4}`);
  }

  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 80)));
