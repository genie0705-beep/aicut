const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page = pages[0];
  if (!page) { page = await b.newPage(); }
  page.on('dialog', async d => { await d.dismiss(); });
  
  // Try direct rank URL
  await page.goto('https://admin.blog.naver.com/aicut/stat/rank/view', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(5000);
  console.log('URL:', page.url());
  let text = await page.evaluate(() => document.body.innerText);
  console.log('Rank page (first 2000):');
  console.log(text.substring(0, 2000));
  
  if (text.length < 500) {
    // Try other possible URLs
    const urls = [
      'https://admin.blog.naver.com/aicut/stat/rank',
      'https://admin.blog.naver.com/aicut/stat/rank/post',
      'https://admin.blog.naver.com/aicut/stat/post'
    ];
    for (const u of urls) {
      await page.goto(u, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(3000);
      const t = await page.evaluate(() => document.body.innerText);
      console.log('\n' + u + ' -> ' + t.replace(/\n/g, ' ').substring(0, 200));
    }
  }
  
  process.exit(0);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
