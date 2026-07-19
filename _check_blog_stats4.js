const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page = pages[0];
  if (!page) { page = await b.newPage(); }
  page.on('dialog', async d => { await d.dismiss(); });
  
  // Go to blog statistics page
  await page.goto('https://admin.blog.naver.com/aicut/stat/today', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(5000);
  
  console.log('URL:', page.url());
  const text = await page.evaluate(() => document.body.innerText);
  console.log('Stats text (first 3000):');
  console.log(text.substring(0, 3000));
  
  // Get ALL text
  console.log('\n--- ALL TEXT (' + text.length + ' chars) ---');
  console.log(text);
  
  process.exit(0);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
