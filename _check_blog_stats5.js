const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page = pages[0];
  if (!page) { page = await b.newPage(); }
  page.on('dialog', async d => { await d.dismiss(); });
  
  // Go to stats page
  await page.goto('https://admin.blog.naver.com/aicut/stat/today', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(5000);
  
  // Try clicking 조회수 순위 (Views Ranking)
  const clickResult = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a, button, span, div'));
    for (const el of links) {
      if (el.textContent && el.textContent.trim().includes('조회수 순위')) {
        el.click();
        return 'CLICKED: ' + el.textContent.trim().substring(0, 30);
      }
    }
    // Try also '순위'
    for (const el of links) {
      if (el.textContent && el.textContent.trim() === '순위') {
        el.click();
        return 'CLICKED 순위';
      }
    }
    return 'NOT_FOUND';
  });
  console.log('Click result:', clickResult);
  
  await page.waitForTimeout(3000);
  
  // Now get the full page text
  const text = await page.evaluate(() => document.body.innerText);
  console.log('Page text after click:');
  console.log(text);
  
  process.exit(0);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
