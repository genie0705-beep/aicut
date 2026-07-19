const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  
  // Tab 5 is the section.blog.naver.com page
  let p = pages[5];
  console.log('Tab5 URL:', p.url());
  
  // Check if it has loaded
  await p.waitForTimeout(3000);
  
  // Check frames
  const frames = p.frames();
  console.log('Frames:', frames.length);
  for (let i=0;i<frames.length;i++) {
    try {
      const url = frames[i].url();
      if (url !== 'about:blank') {
        const text = await frames[i].evaluate(() => document.body.innerText.substring(0, 300));
        console.log(`Frame ${i}: ${url.substring(0,100)}`);
        console.log(`  Text: ${text.replace(/\s+/g,' ').substring(0,150)}`);
      }
    } catch(e) {}
  }
  
  // Try clicking around - look for blog list or management links
  const links = await p.evaluate(() => {
    const aTags = document.querySelectorAll('a');
    return Array.from(aTags).map(a => ({
      text: (a.textContent||'').trim().substring(0,30),
      href: (a.href||'').substring(0,100)
    })).filter(l => l.text || l.href);
  });
  console.log('Links:', links.length);
  // Show links that look blog-related
  links.filter(l => l.href.includes('blog') || l.text.includes('글')).forEach(l => console.log('->', JSON.stringify(l)));
  
  process.exit(0);
})().catch(e=>{console.error('FATAL:',e.message);process.exit(1)});
