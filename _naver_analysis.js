const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  const adsPage = pages.find(p => p.url().includes('ads.naver.com'));
  
  // Go to dashboard fresh
  await adsPage.goto('https://ads.naver.com/manage/ad-accounts/334739/dashboard', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 3000));
  
  // Get all clickable elements
  const links = await adsPage.evaluate(() => {
    const els = document.querySelectorAll('a, button, [role="button"]');
    return Array.from(els).slice(0, 100).map(e => ({
      tag: e.tagName,
      text: (e.innerText || '').trim().slice(0, 40),
      href: e.href || '',
      visible: e.offsetParent !== null
    })).filter(e => e.text);
  });
  
  links.forEach(l => console.log(
    l.tag.padEnd(8),
    l.visible ? 'VIS' : 'HID',
    '|',
    l.text.slice(0, 50).padEnd(40),
    '|',
    l.href.slice(0, 80)
  ));
  
  // Also get campaign data if any table exists
  const tables = await adsPage.evaluate(() => {
    const ts = document.querySelectorAll('table');
    return Array.from(ts).map(t => t.innerText.slice(0, 1000));
  });
  if (tables.length) {
    console.log('\n=== TABLES FOUND ===');
    tables.forEach((t, i) => console.log(`Table ${i}:`, t.slice(0, 500)));
  } else {
    console.log('\nNo tables found on dashboard');
  }
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
