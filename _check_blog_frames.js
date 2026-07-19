const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page = pages[0];
  if (!page) { page = await b.newPage(); }
  page.on('dialog', async d => { await d.dismiss(); });
  
  // Try to access blog main and find stats
  await page.goto('https://blog.naver.com/aicut', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(3000);
  
  const frames = page.frames();
  console.log('Total frames:', frames.length);
  
  for (let i = 0; i < frames.length; i++) {
    try {
      const url = frames[i].url();
      if (url.includes('naver.com') || url.includes('blog')) {
        console.log(`\nFrame ${i}: ${url.substring(0, 100)}`);
        const text = await frames[i].evaluate(() => document.body.innerText);
        console.log(`  ${text.replace(/\s+/g, ' ').substring(0, 300)}`);
        
        // Get all links
        const links = await frames[i].evaluate(() => {
          return Array.from(document.querySelectorAll('a')).map(a => ({
            text: (a.textContent || '').trim().substring(0, 30),
            href: a.href?.substring(0, 100) || ''
          })).filter(l => l.href).slice(0, 20);
        });
        console.log('  Links:', JSON.stringify(links, null, 2));
      }
    } catch(e) {
      console.log(`\nFrame ${i}: ERROR ${e.message.substring(0, 50)}`);
    }
  }
  
  process.exit(0);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
