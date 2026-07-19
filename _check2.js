const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  try {
    await page.goto('https://blog.naver.com/aicut', { waitUntil: 'load', timeout: 20000 });
    await sleep(4000);
    
    console.log('URL:', page.url());
    console.log('Title:', await page.title());
    
    // Get body text properly
    const bodyText = await page.evaluate(() => document.body?.innerText?.substring(0, 500) || 'NO BODY');
    console.log('Body:', bodyText);
    
    // Get all visible text
    const allText = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a, span, div, button'))
        .filter(el => el.offsetParent !== null)
        .slice(0, 30)
        .map(el => ({ tag: el.tagName, text: (el.textContent || '').trim().substring(0, 40), cls: el.className?.substring(0, 40) }));
    });
    console.log('Visible elements:');
    allText.forEach((el, i) => console.log(`  [${i}] <${el.tag}> ${el.text} | ${el.cls}`));
    
  } finally {
    await page.close();
  }
})();
