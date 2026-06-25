const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  
  console.log('=== Open Tabs ===');
  for (let i = 0; i < pages.length; i++) {
    const url = pages[i].url();
    const title = await pages[i].title().catch(() => '');
    console.log(`[${i}] ${title.substring(0, 50)}`);
    console.log(`    ${url.substring(0, 120)}`);
  }
  
  // Find IG tab
  let igPage = null;
  for (const p of pages) {
    const url = p.url();
    if (url.includes('instagram') || url.includes('instagram.com')) {
      igPage = p;
      console.log('\nFound IG tab at index', pages.indexOf(p));
      break;
    }
  }
  
  if (!igPage) {
    console.log('\n⚠️ No Instagram tab found. Opening Instagram...');
    igPage = await ctx.newPage();
    await igPage.goto('https://www.instagram.com/aicut.official/', { waitUntil: 'networkidle', timeout: 30000 });
    await igPage.waitForTimeout(3000);
    console.log('Opened:', igPage.url());
  }
  
  await igPage.bringToFront();
  await igPage.waitForTimeout(2000);
  
  // Take screenshot
  await igPage.screenshot({ path: 'ig_current.png' });
  
  // Check for buttons
  const btns = await igPage.evaluate(() => {
    const result = [];
    document.querySelectorAll('div[role="button"], button').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width > 10 && r.height > 10) {
        const text = (el.innerText || '').trim();
        if (text) {
          result.push({ text: text.substring(0, 20), x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) });
        }
      }
    });
    return result;
  });
  
  console.log('\n=== Buttons ===');
  btns.forEach(b => console.log(`  "${b.text}" (${b.x}, ${b.y})`));
  
  await browser.close();
})();
