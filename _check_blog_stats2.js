const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page = pages[0];
  if (!page) { page = await b.newPage(); }
  page.on('dialog', async d => { await d.dismiss(); });
  
  // Try blog statistics page
  await page.goto('https://blog.naver.com/BlogStatisticsHome.naver?blogId=aicut', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(5000);
  console.log('Stats URL:', page.url());
  const text = await page.evaluate(() => document.body.innerText);
  console.log('Stats text (first 1500):', text.substring(0, 1500));
  
  process.exit(0);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
