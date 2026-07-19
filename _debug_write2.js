const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  
  // Use tab 3 (the blog post page - likely logged in)
  let p = pages[3];
  console.log('Tab3 URL:', p.url());
  
  // Go to aicut blog
  await p.goto('https://blog.naver.com/PostWrite.naver?blogId=aicut&popup=0', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await p.waitForTimeout(5000);
  console.log('Write URL:', p.url());
  
  // Check content
  const text = await p.evaluate(() => document.body.innerText.substring(0, 500));
  console.log('Page text:', text);
  
  process.exit(0);
})().catch(e=>{console.error('FATAL:',e.message);process.exit(1)});
