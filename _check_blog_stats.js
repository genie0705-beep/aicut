const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page = pages[0];
  if (!page) { page = await b.newPage(); }
  page.on('dialog', async d => { await d.dismiss(); });
  
  // Try to access blog statistics
  await page.goto('https://blog.naver.com/aicut', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(5000);
  console.log('Blog URL:', page.url());
  
  const text = await page.evaluate(() => document.body.innerText);
  console.log('Blog text (first 2000):', text.substring(0, 2000));
  
  // Check for iframes
  const frames = page.frames();
  console.log('\nFrames:', frames.length);
  for (let i = 0; i < frames.length; i++) {
    try {
      const url = frames[i].url();
      if (!url.includes('about:blank')) {
        const t = await frames[i].evaluate(() => document.body.innerText);
        console.log(`Frame ${i}: ${url.substring(0, 80)}`);
        console.log('  Text:', t.substring(0, 200));
      }
    } catch(e) {}
  }
  
  process.exit(0);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
