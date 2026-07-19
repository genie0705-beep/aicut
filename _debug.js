const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  const errors = [];
  page.on('pageerror', err => {
    errors.push({stack: err.stack?.substring(0, 300)});
  });
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push({console: msg.text(), location: msg.location()?.url});
  });
  page.on('response', r => {
    if (r.status() >= 400) errors.push({failed_url: r.url(), status: r.status()});
  });
  
  await page.goto('https://aicut.co.kr/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(5000);
  
  console.log('ALL ERRORS:', JSON.stringify(errors, null, 2));
  
  try { b.disconnect(); } catch(e) {}
})();
