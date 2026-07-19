const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let p = pages[5]; // blog home page
  
  // Navigate to blog main page
  await p.goto('https://blog.naver.com/aicut', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await p.waitForTimeout(5000);
  
  // Check all frames in detail
  const frames = p.frames();
  console.log('Total frames:', frames.length);
  for (let i=0;i<frames.length;i++) {
    try {
      const url = frames[i].url();
      if (url !== 'about:blank') {
        const title = await frames[i].evaluate(() => document.title || '');
        const htmlSample = await frames[i].evaluate(() => document.body.innerHTML.substring(0, 200));
        console.log(`Frame ${i}: ${url.substring(0, 80)} | title=${title.substring(0,30)}`);
        if (htmlSample.includes('글쓰기') || htmlSample.includes('write') || htmlSample.includes('PostWrite')) {
          console.log('  *** HAS WRITE BUTTON ***');
          console.log('  HTML:', htmlSample.substring(0, 300));
        }
      }
    } catch(e) {
      console.log(`Frame ${i}: ERROR ${e.message.substring(0,50)}`);
    }
  }
  
  process.exit(0);
})().catch(e=>{console.error('FATAL:',e.message);process.exit(1)});
