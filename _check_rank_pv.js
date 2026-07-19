const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page = pages[0];
  if (!page) { page = await b.newPage(); }
  page.on('dialog', async d => { await d.dismiss(); });
  
  // Direct navigation to the rank page URL found from the href
  await page.goto('https://admin.blog.naver.com/aicut/stat/rank_pv', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(5000);
  
  console.log('URL:', page.url());
  const text = await page.evaluate(() => document.body.innerText);
  console.log('Rank PV page text:');
  console.log(text);
  
  process.exit(0);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
