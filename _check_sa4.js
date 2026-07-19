const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page = pages[0];
  if (!page) { page = await b.newPage(); }
  page.on('dialog', async d => { await d.dismiss(); });
  
  // Try main console
  await page.goto('https://searchadvisor.naver.com/console', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(5000);
  console.log('Console URL:', page.url());
  const text = await page.evaluate(() => document.body.innerText);
  console.log('Console text (first 2000):', text.substring(0, 2000));
  
  process.exit(0);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
