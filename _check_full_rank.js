const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page = pages[0];
  if (!page) { page = await b.newPage(); }
  page.on('dialog', async d => { await d.dismiss(); });
  
  // Go to stats page first to establish session
  await page.goto('https://admin.blog.naver.com/aicut/stat/today', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(3000);
  
  // Access the rank iframe with weekly data
  // Try weekly period
  const weeklyUrl = 'https://blog.stat.naver.com/blog/rank/cv/content?blogId=aicut&isIE8=false&term=week&startDate=20260711';
  await page.goto(weeklyUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(3000);
  
  console.log('URL:', page.url());
  const text = await page.evaluate(() => document.body.innerText);
  console.log('WEEKLY RANK:');
  console.log(text);
  
  // Now try monthly
  const monthlyUrl = 'https://blog.stat.naver.com/blog/rank/cv/content?blogId=aicut&isIE8=false&term=month&startDate=20260701';
  await page.goto(monthlyUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(3000);
  
  const text2 = await page.evaluate(() => document.body.innerText);
  console.log('\nMONTHLY RANK:');
  console.log(text2);
  
  // Try getting the iframe directly from the admin page
  await page.goto('https://admin.blog.naver.com/aicut/stat/rank_pv', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(5000);
  
  const frames = page.frames();
  console.log('\nAll frames on admin page:');
  for (let i = 0; i < frames.length; i++) {
    try {
      const url = frames[i].url();
      console.log(`Frame ${i}: ${url.substring(0, 100)}`);
    } catch(e) {
      console.log(`Frame ${i}: ERROR`);
    }
  }
  
  // Get the rank iframe content
  const rankFrame = frames.find(f => f.url().includes('blog.stat.naver.com/blog/rank'));
  if (rankFrame) {
    const rankText = await rankFrame.evaluate(() => document.body.innerText);
    console.log('\n=== RANK DATA ===');
    console.log(rankText);
  }
  
  process.exit(0);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
