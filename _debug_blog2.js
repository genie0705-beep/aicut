const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  
  // Check tab 5 (blog home)
  const blogHome = pages[5];
  console.log('Tab 5 URL:', blogHome.url());
  const html = await blogHome.content();
  console.log('Body snippet:', html.substring(0, 1000));
  
  process.exit(0);
})().catch(e=>{console.error('FATAL:',e.message);process.exit(1)});
