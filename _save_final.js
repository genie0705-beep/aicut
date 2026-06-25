const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  let page = null;
  for (const p of ctx.pages()) { if (p.url().includes('PostWriteForm')) { page = p; break; } }
  if (!page) { console.log('no page'); await b.close(); return; }
  
  console.log('저장 시작...');
  
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if ((btn.innerText || '').trim() === '저장') { btn.click(); return; }
    }
  });
  await page.waitForTimeout(8000);
  
  const r = await page.evaluate(() => {
    const res = {};
    try {
      const ed = SmartEditor._editors['blogpc001'];
      res.title = ed.getDocumentTitle();
      const d = ed.getDocumentData();
      const comps = d.document ? d.document.components : [];
      res.compCount = comps.length;
      const textComp = comps.find(c => c.type === 'text');
      res.paraCount = textComp && textComp.value ? textComp.value.length : 0;
    } catch(e) { res.error = e.message; }
    const els = document.querySelectorAll('[class*="toast"], [class*="Toast"]');
    res.toast = els.length > 0 ? Array.from(els).map(e => (e.innerText || '').trim()).join(' | ') : '없음';
    const inputs = document.querySelectorAll('input');
    for (const inp of inputs) {
      if ((inp.placeholder || '').includes('글감')) {
        res.tagCount = inp.value.split('#').filter(t => t.trim().length > 0).length;
      }
    }
    return res;
  });
  
  console.log('제목:', r.title);
  console.log('컴포넌트:', r.compCount + '개 (text paragraph ' + r.paraCount + '개)');
  console.log('해시태그:', r.tagCount + '개');
  console.log('토스트:', r.toast);
  
  if (r.title && r.paraCount > 0 && r.tagCount >= 30) {
    console.log('\n✅ 저장 정상 완료!');
    console.log('📌 발행만 누르시면 됩니다!');
  } else {
    console.log('\n❌ 문제 있음');
  }
  
  await b.close();
})();
