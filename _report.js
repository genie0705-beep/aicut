const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  let page = null;
  for (const p of ctx.pages()) { if (p.url().includes('PostWriteForm')) { page = p; break; } }
  if (!page) { console.log('no page'); await b.close(); return; }
  
  const r = await page.evaluate(() => {
    const result = {};
    // 제목
    try { result.title = SmartEditor._editors['blogpc001'].getDocumentTitle(); } catch(e) { result.title = 'err'; }
    // iframe 내용
    const iframe = document.querySelector('iframe');
    if (iframe && iframe.contentDocument) {
      const body = iframe.contentDocument.body;
      result.iframeLen = body.innerHTML.length;
      result.iframeText = body.innerText.substring(0, 200);
      result.h2 = body.querySelectorAll('h2').length;
      result.img = body.querySelectorAll('img').length;
      result.p = body.querySelectorAll('p').length;
    } else {
      result.iframeError = '접근불가';
    }
    // 해시태그
    const inputs = document.querySelectorAll('input');
    for (const inp of inputs) {
      if ((inp.placeholder || '').includes('글감')) {
        result.tags = inp.value.substring(0, 100);
        result.tagCount = inp.value.split('#').filter(t => t.trim().length > 0).length;
      }
    }
    // 저장 버튼
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if ((btn.innerText || '').trim() === '저장') { result.saveBtn = '있음'; break; }
    }
    return result;
  });
  
  console.log('=== 현재 포스팅 최종 상태 ===');
  console.log('제목:', r.title);
  console.log('iframe HTML:', r.iframeLen > 0 ? r.iframeLen + ' chars ✅' : '0 chars ❌');
  console.log('H2:', r.h2 + '개');
  console.log('P:', r.p + '개');
  console.log('이미지:', r.img + '개');
  console.log('해시태그:', r.tagCount + '개');
  console.log('저장버튼:', r.saveBtn);
  if (r.iframeText) console.log('본문 미리보기:', r.iframeText.substring(0, 100));
  
  await b.close();
})();
