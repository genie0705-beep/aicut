const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  const resources = [];
  page.on('response', response => {
    if (response.status() >= 400) {
      resources.push({ url: response.url(), status: response.status() });
    }
  });
  
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  await page.goto('https://aicut.co.kr/', { waitUntil: 'load', timeout: 20000 });
  await page.waitForTimeout(3000);
  
  console.log('Failed resources:', JSON.stringify(resources, null, 2));
  
  // Check if page-pricing exists in DOM
  const exists = await page.evaluate(() => !!document.getElementById('page-pricing'));
  const activePages = await page.evaluate(() => Array.from(document.querySelectorAll('.page.active')).map(p => p.id));
  const allPages = await page.evaluate(() => Array.from(document.querySelectorAll('[id^="page-"]')).map(p => p.id));
  
  console.log('All page elements:', JSON.stringify(allPages));
  console.log('Active pages:', JSON.stringify(activePages));
  console.log('page-pricing exists:', exists);
  
  try { b.disconnect(); } catch(e) {}
  console.log('DONE');
})().catch(e => { console.error('ERR:', e.message); process.exit(1); });
