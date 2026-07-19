const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page = pages[0];
  if (!page) { page = await b.newPage(); }
  page.on('dialog', async d => { await d.dismiss(); });
  
  // Try blog management page with stats
  const urls = [
    'https://blog.naver.com/BlogManageHome.naver?blogId=aicut',
    'https://blog.naver.com/BlogStatsHome.naver?blogId=aicut',
    'https://section.blog.naver.com/aicut',
    'https://www.blog.naver.com/aicut',
    'https://blog.naver.com/PostList.naver?blogId=aicut',
  ];
  
  for (const url of urls) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(3000);
      const url2 = page.url();
      const text = await page.evaluate(() => document.body.innerText);
      console.log(`[${url.substring(0, 60)}]`);
      console.log(`  -> ${url2.substring(0, 80)}`);
      console.log(`  text: ${text.replace(/\s+/g, ' ').substring(0, 200)}`);
      console.log('');
    } catch(e) {
      console.log(`[${url.substring(0, 60)}] ERR: ${e.message.substring(0, 60)}`);
    }
  }
  
  process.exit(0);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
