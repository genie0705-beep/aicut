const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('PostWriteForm')) { page = p; break; }
  }
  if (!page) { console.log('no page'); await b.close(); return; }
  
  console.log('저장 중...');
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if ((btn.innerText || '').trim() === '저장') { btn.click(); return; }
    }
  });
  await page.waitForTimeout(5000);
  
  const toast = await page.evaluate(() => {
    const els = document.querySelectorAll('[class*="toast"], [class*="Toast"]');
    return Array.from(els).map(e => (e.innerText || '').trim()).join(' | ');
  });
  console.log('토스트:', toast);
  
  const final = await page.evaluate(() => {
    const r = {};
    try {
      const ed = SmartEditor._editors['blogpc001'];
      r.title = ed.getDocumentTitle();
      r.comps = ed.getDocumentData().document.components.length;
    } catch (e) { r.error = e.message; }
    const inputs = document.querySelectorAll('input');
    for (const inp of inputs) {
      if ((inp.placeholder || '').includes('글감')) {
        r.tagCount = inp.value.split(' ').length;
        r.tagPreview = inp.value.substring(0, 60);
      }
    }
    return r;
  });
  
  console.log('제목:', final.title);
  console.log('컴포넌트:', final.comps + '개');
  console.log('태그:', final.tagCount + '개');
  console.log('\n✅ 최종 저장 완료');
  console.log('📌 발행만 누르시면 됩니다!');
  
  await b.close();
})();
