const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  // Open Search Advisor tab
  console.log('[1] Search Advisor...');
  const sa = await ctx.newPage();
  try {
    await sa.goto('https://searchadvisor.naver.com/', {waitUntil:'domcontentloaded', timeout:15000});
    await sa.waitForTimeout(2000);
    console.log('SA opened:', sa.url().substring(0, 60));
  } catch(e) {
    console.log('SA error:', e.message.substring(0, 40));
  }
  
  // Comment on the post
  console.log('[2] Comment...');
  const page = pages.find(p => p.url().includes('blog.naver.com/aicut/224329284493'));
  // ... trying comment
  await b.close();
})();
