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
  
  // Dismiss popup first using Playwright click
  const dismissBtn = page.locator('a.button_resend, a:has-text("다시 보지 않기")').first();
  if (await dismissBtn.isVisible()) {
    await dismissBtn.click();
    await page.waitForTimeout(1000);
  }
  
  // Check actual HTML content of the left nav area
  const navHtml = await page.evaluate(() => {
    // Find the navigation area
    const nav = document.querySelector('.lnb, .aside, nav, [class*=aside], [class*=lnb], [class*=nav]');
    if (nav) return nav.innerHTML.substring(0, 3000);
    return 'nav not found';
  });
  console.log('Nav HTML (first 3000):');
  console.log(navHtml);
  
  process.exit(0);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
