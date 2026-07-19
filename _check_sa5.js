const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page = pages[0];
  if (!page) { page = await b.newPage(); }
  page.on('dialog', async d => { await d.dismiss(); });
  
  // Find the actual link to webmaster tools
  await page.goto('https://searchadvisor.naver.com/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(3000);
  
  const links = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a'));
    return anchors.map(a => ({ text: (a.textContent || '').trim().substring(0, 50), href: a.href })).filter(a => a.href);
  });
  console.log('Links:', JSON.stringify(links, null, 2));
  
  process.exit(0);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
