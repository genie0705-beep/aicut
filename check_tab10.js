const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });
  
  const pages = ctx.pages();
  
  // [9] Vrew 페이지 확인
  const vrewPage = pages[9];
  console.log('[9] URL:', vrewPage.url().substring(0, 100));
  const vrewText = await vrewPage.evaluate(() => document.body.innerText.substring(0, 300)).catch(() => '');
  console.log('[9] 텍스트:', vrewText.substring(0, 200));
  
  // [6] postwrite 페이지 확인
  const pwPage = pages[6];
  console.log('\n[6] URL:', pwPage.url().substring(0, 100));
  const pwText = await pwPage.evaluate(() => document.body.innerText.substring(0, 300)).catch(() => '');
  console.log('[6] 텍스트:', pwText.substring(0, 200));
  
  // contenteditable 확인
  const ceCount = await pwPage.evaluate(() => document.querySelectorAll('[contenteditable]').length).catch(() => -1);
  console.log('[6] contenteditable 수:', ceCount);
  
  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));
