const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  
  const page = await ctx.newPage();
  await page.goto('https://www.instagram.com/aicut.official/', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(3000);
  
  const data = await page.evaluate(() => {
    const text = document.body?.innerText || '';
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    return lines.slice(0, 80);
  });
  
  console.log('=== @aicut.official 프로필 ===');
  for (const l of data) console.log(l);
  
  await page.close();
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
