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
  
  // Dismiss any popup
  try {
    const popupBtn = page.locator('a:has-text("다시 보지 않기")');
    if (await popupBtn.count() > 0) {
      await popupBtn.click();
      await page.waitForTimeout(1000);
    }
  } catch(e) {}
  
  // Use Playwright locator to click "조회수 순위"
  const rankItem = page.getByText('조회수 순위', { exact: true });
  const count = await rankItem.count();
  console.log('조회수 순위 found:', count);
  
  if (count > 0) {
    await rankItem.first().click();
    await page.waitForTimeout(3000);
  } else {
    // Try partial match
    const partial = page.locator('text=조회수 순위');
    console.log('Partial match count:', await partial.count());
    if (await partial.count() > 0) {
      await partial.first().click();
      await page.waitForTimeout(3000);
    }
  }
  
  // Get page content
  const text = await page.evaluate(() => document.body.innerText);
  console.log('Page text after click:');
  console.log(text);
  
  // Check for any new elements that appeared
  const newElements = await page.evaluate(() => {
    const allDivs = Array.from(document.querySelectorAll('div, table, tr, td'));
    return allDivs
      .filter(d => d.children.length === 0 && d.textContent && d.textContent.trim().length > 0)
      .map(d => d.textContent.trim().substring(0, 40))
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 30);
  });
  console.log('\nElements with text:', JSON.stringify(newElements));
  
  process.exit(0);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
