const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  // Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text());
  });
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  // Test hash navigation to #pricing
  await page.goto('https://aicut.co.kr/#pricing', { waitUntil: 'load', timeout: 20000 });
  await page.waitForTimeout(5000);
  
  const result = await page.evaluate(() => {
    // Check what happened
    const pricingEl = document.getElementById('page-pricing');
    const isActive = pricingEl?.classList.contains('active');
    const hash = window.location.hash;
    const allActive = Array.from(document.querySelectorAll('.page.active')).map(p => p.id);
    return {
      hash,
      pricingExists: !!pricingEl,
      pricingActive: isActive,
      allActivePages: allActive
    };
  });
  console.log('RESULT:', JSON.stringify(result, null, 2));
  
  await page.screenshot({ path: 'C:/Users/paul/.openclaw/workspace/verify_pricing_hash.png' });
  
  try { b.disconnect(); } catch(e) {}
  console.log('DONE');
})().catch(e => { console.error('ERR:', e.message); process.exit(1); });
