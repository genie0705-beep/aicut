const { chromium } = require('playwright');
(async () => {
  try {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
    const context = browser.contexts()[0];
    const pages = context.pages();
    let page = pages.find(p => p.url().includes('aicut.co.kr'));
    if (!page) page = pages[0];

    await page.goto('https://aicut.co.kr/', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(3000);

    // Check all virtual pages by clicking through them
    const virtualPages = [];
    
    // Try showPage functions
    for (const pg of ['home', 'pricing', 'client']) {
      const title = await page.evaluate((pg) => {
        if (typeof showPage === 'function') {
          showPage(pg);
          return document.title;
        }
        return 'showPage not found';
      }, pg);
      await page.waitForTimeout(500);
      virtualPages.push({ page: pg, title });
      console.log(`showPage('${pg}') => title: ${title}`);
    }

    // Check if each section has content
    const sections = await page.evaluate(() => {
      const sections = ['service-section', 'vfx-section', 'process-section', 'steps-section', 'reviews-section', 'pricing-section'];
      const result = {};
      sections.forEach(id => {
        const el = document.getElementById(id);
        result[id] = el ? el.innerText.slice(0, 100).replace(/\n/g, ' ') : 'NOT FOUND';
      });
      return result;
    });
    
    console.log('\n=== SECTIONS ===');
    Object.entries(sections).forEach(([k, v]) => console.log(`${k}: ${v}`));

    // Check initial HTML (what crawler sees - without JS execution)
    const initialHtml = await page.evaluate(() => {
      // Get the raw HTML before any JS modifications
      return document.documentElement.outerHTML.slice(0, 3000);
    });
    
    console.log('\n=== Initial HTML (first 3000 chars) ===');
    console.log(initialHtml);

    // Check if there's a 404.html trick
    try {
      await page.goto('https://aicut.co.kr/pricing', { waitUntil: 'domcontentloaded', timeout: 10000 });
      const pricingPageHtml = await page.evaluate(() => {
        return document.documentElement.outerHTML.slice(0, 2000);
      });
      console.log('\n=== /pricing page HTML (first 2000 chars) ===');
      console.log(pricingPageHtml);
    } catch(e) {
      console.log('/pricing: error -', e.message.slice(0, 80));
    }

  } catch(e) {
    console.error('Script Error:', e.message);
  }
})();
