const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  let page = null;
  for (const p of ctx.pages()) { if (p.url().includes('PostWriteForm')) { page = p; break; } }
  if (!page) { console.log('no page'); await b.close(); return; }
  
  console.log('저장 버튼 클릭 + 토스트 확인...');
  
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if ((btn.innerText || '').trim() === '저장') { btn.click(); return; }
    }
  });
  
  // autosave_message 확인 (최대 20초 대기)
  let toast = '';
  for (let i = 0; i < 20; i++) {
    toast = await page.evaluate(() => {
      const el = document.querySelector('[class*="autosave"]');
      return el ? (el.innerText || '').trim() : '';
    });
    if (toast) break;
    await page.waitForTimeout(1000);
  }
  
  console.log('토스트:', toast || '(없음)');
  
  if (toast) {
    console.log('\n✅ 저장 완료 (토스트: "' + toast + '")');
    console.log('📌 발행만 누르시면 됩니다!');
  } else {
    console.log('\n❌ 저장 안 됨 (토스트 없음)');
  }
  
  await b.close();
})();
