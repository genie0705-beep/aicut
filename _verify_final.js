const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  console.log('=== 1. HOME PAGE ===');
  await page.goto('https://aicut.co.kr/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(2000);
  
  let home = await page.evaluate(() => ({
    url: window.location.href,
    activePages: Array.from(document.querySelectorAll('.page.active')).map(p => p.id),
    heroVideo: document.querySelector('#heroBgVideo')?.getAttribute('src')?.substring(0, 60) || 'not found',
    vfxVideo: document.querySelector('#vfxBgVideo source')?.getAttribute('src')?.substring(0, 60) || 'checking alt...'
  }));
  console.log('Home:', JSON.stringify(home, null, 2));
  
  // Click pricing link
  console.log('\n=== 2. PRICING PAGE ===');
  const pricingLink = await page.evaluate(() => {
    const a = Array.from(document.querySelectorAll('nav a')).find(el => el.innerText.includes('요금제'));
    if (a) { a.click(); return { href: a.href, text: a.innerText }; }
    return null;
  });
  console.log('Clicked:', JSON.stringify(pricingLink));
  await page.waitForTimeout(2000);
  
  let pricingState = await page.evaluate(() => ({
    url: window.location.href,
    activePages: Array.from(document.querySelectorAll('.page.active')).map(p => p.id),
    hasPricingContent: !!document.querySelector('#page-pricing')
  }));
  console.log('After pricing click:', JSON.stringify(pricingState, null, 2));
  
  // Try direct #pricing hash
  console.log('\n=== 3. DIRECT #pricing HASH ===');
  await page.goto('https://aicut.co.kr/#pricing', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(3000);
  
  let hashState = await page.evaluate(() => ({
    url: window.location.href,
    activePages: Array.from(document.querySelectorAll('.page.active')).map(p => p.id)
  }));
  console.log('After hash navigation:', JSON.stringify(hashState, null, 2));
  
  // Check service section
  console.log('\n=== 4. SERVICE SECTION ===');
  await page.goto('https://aicut.co.kr/#service-section', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(2000);
  
  await page.screenshot({ path: 'C:/Users/paul/.openclaw/workspace/verify_final.png' });
  console.log('Screenshot saved');
  
  b.disconnect();
  console.log('\nDONE');
})().catch(e => { console.error('ERR:', e.message); process.exit(1); });
