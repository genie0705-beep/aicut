const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let p = pages[5];
  
  // Go to blog management page
  await p.goto('https://blog.naver.com/BlogManage.naver?blogId=aicut', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await p.waitForTimeout(5000);
  console.log('Manage URL:', p.url());
  
  // Check frames for write button
  const frames = p.frames();
  console.log('Frames:', frames.length);
  for (let i=0;i<frames.length;i++) {
    try {
      const url = frames[i].url().substring(0,100);
      const html = await frames[i].evaluate(() => document.body.innerHTML.substring(0, 1000));
      if (html.includes('글쓰기') || html.includes('write') || html.includes('PostWrite')) {
        console.log(`Frame ${i}: ${url}`);
        console.log('Has write btn!');
        // Try to find the exact button
        const btnInfo = await frames[i].evaluate(() => {
          const links = document.querySelectorAll('a');
          const writeLinks = Array.from(links).filter(l => (l.textContent||'').includes('글') || (l.href||'').includes('write'));
          return writeLinks.map(l => ({ text: (l.textContent||'').trim().substring(0,20), href: (l.href||'').substring(0,100) }));
        });
        console.log('Write buttons:', JSON.stringify(btnInfo));
        break;
      }
    } catch(e) {}
  }
  
  // Check the main frame content
  const mainText = await p.evaluate(() => document.body.innerText.substring(0, 500));
  console.log('Main text:', mainText.replace(/\s+/g, ' ').substring(0, 200));
  
  process.exit(0);
})().catch(e=>{console.error('FATAL:',e.message);process.exit(1)});
