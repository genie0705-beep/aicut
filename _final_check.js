const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('PostWriteForm')) { page = p; break; }
  }
  if (!page) { console.log('에디터 페이지 없음'); await b.close(); return; }
  
  console.log('=== 현재 포스팅 상태 정밀 분석 ===\n');
  
  // 1. 제목
  const title = await page.evaluate(() => {
    try { return SmartEditor._editors['blogpc001'].getDocumentTitle(); } catch(e) { return 'ERROR'; }
  });
  console.log('[1] 제목:', title ? '"' + title + '" ✅' : '없음 ❌');
  
  // 2. 컴포넌트 수
  const compData = await page.evaluate(() => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      const d = ed.getDocumentData();
      const comps = d.document ? d.document.components : [];
      return { count: comps.length, types: comps.map(c => c.type || c['@ctype']).join(', ') };
    } catch(e) { return { error: e.message }; }
  });
  console.log('[2] 컴포넌트:', compData.count + '개');
  
  // 3. iframe 내용
  const iframeData = await page.evaluate(() => {
    const r = {};
    const iframe = document.querySelector('iframe');
    if (iframe && iframe.contentDocument) {
      const body = iframe.contentDocument.body;
      r.htmlLen = body.innerHTML.length;
      r.textLen = body.innerText.length;
      r.h2 = body.querySelectorAll('h2').length;
      r.strong = body.querySelectorAll('strong, b').length;
      r.p = body.querySelectorAll('p').length;
      r.img = body.querySelectorAll('img').length;
      r.textPreview = body.innerText.substring(0, 100);
    } else {
      r.error = 'iframe 접근 불가';
    }
    return r;
  });
  console.log('[3] iframe 화면 표시:');
  console.log('   HTML 길이:', iframeData.htmlLen + ' chars');
  console.log('   H2:', iframeData.h2 + '개');
  console.log('   Strong:', iframeData.strong + '개');
  console.log('   P:', iframeData.p + '개');
  console.log('   이미지:', iframeData.img + '개');
  console.log('   텍스트 미리보기:', iframeData.textPreview || '(없음)');
  
  // 4. 해시태그 (글감 input)
  const tags = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    for (const inp of inputs) {
      if ((inp.placeholder || '').includes('글감')) {
        const val = inp.value;
        return { value: val, count: val.split('#').filter(t => t.trim().length > 0).length };
      }
    }
    return { error: '글감 input 못 찾음' };
  });
  console.log('[4] 해시태그:', tags.count + '개');
  console.log('   내용:', tags.value ? tags.value.substring(0, 80) + '...' : '없음');
  
  // 5. 저장 버튼 상태
  const saveBtn = await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if ((btn.innerText || '').trim() === '저장') {
        return { found: true, text: btn.innerText };
      }
    }
    return { found: false };
  });
  console.log('[5] 저장 버튼:', saveBtn.found ? '존재 ✅' : '없음 ❌');
  
  // 6. 토스트 메시지
  const toast = await page.evaluate(() => {
    const els = document.querySelectorAll('[class*="toast"], [class*="Toast"]');
    return els.length > 0 ? Array.from(els).map(e => (e.innerText || '').trim()).join(' | ') : '없음';
  });
  console.log('[6] 토스트 메시지:', toast);
  
  console.log('\n=== 분석 완료 ===');
  
  await b.close();
})();
