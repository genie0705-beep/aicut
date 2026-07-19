const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page = pages[0];
  if (!page) { page = await b.newPage(); }
  page.on('dialog', async d => { await d.dismiss(); });
  
  // Go to Naver Search Advisor blog analysis
  await page.goto('https://searchadvisor.naver.com/board/blog', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000);
  
  console.log('URL:', page.url());
  const text = await page.evaluate(() => document.body.innerText);
  console.log('PAGE TEXT (first 2000 chars):');
  console.log(text.substring(0, 2000));
  
  process.exit(0);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
