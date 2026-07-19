const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page = pages[0];
  if (!page) { page = await b.newPage(); }
  page.on('dialog', async d => { await d.dismiss(); });
  
  await page.goto('https://admin.blog.naver.com/aicut/stat/today', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(5000);
  
  // First dismiss any popup - click "다시 보지 않기" or "확인"
  await page.evaluate(() => {
    const btns = document.querySelectorAll('a');
    btns.forEach(b => {
      if (b.textContent.includes('다시 보지 않기')) b.click();
    });
  });
  await page.waitForTimeout(1000);
  
  // Now click on "조회수 순위" - find it in navigation
  await page.evaluate(() => {
    const items = document.querySelectorAll('a, button, span, li');
    for (const el of items) {
      if (el.textContent && el.textContent.trim() === '조회수 순위') {
        console.log('FOUND 조회수 순위:', el.tagName, el.className);
        el.click();
        return;
      }
    }
    // Try partial match
    for (const el of items) {
      if (el.textContent && el.textContent.includes('조회수 순위')) {
        console.log('FOUND partial:', el.tagName, el.className);
        el.click();
        return;
      }
    }
    console.log('NOT FOUND');
  });
  
  await page.waitForTimeout(3000);
  
  const text = await page.evaluate(() => document.body.innerText);
  console.log('After click text:');
  console.log(text);
  
  process.exit(0);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
