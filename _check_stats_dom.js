const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page = pages[0];
  if (!page) { page = await b.newPage(); }
  page.on('dialog', async d => { await d.dismiss(); });
  
  await page.goto('https://admin.blog.naver.com/aicut/stat/today', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(5000);
  
  // Check the HTML structure for the stats page
  const html = await page.evaluate(() => {
    // Find all interactive elements
    const interactives = Array.from(document.querySelectorAll('a, button, [role=button], [role=tab], [role=menuitem], span[onclick], li'));
    return interactives.map(el => ({
      tag: el.tagName,
      id: el.id,
      cls: el.className.substring(0, 60),
      text: (el.textContent || '').trim().replace(/\s+/g, ' ').substring(0, 50),
      href: el.href || '',
      role: el.getAttribute('role') || ''
    })).filter(el => el.text).slice(0, 50);
  });
  
  console.log('Interactive elements:');
  html.forEach((h, i) => console.log(`${i}: <${h.tag}> id=${h.id.substring(0,20)} cls=${h.cls.substring(0,30)} text=${h.text.substring(0,40)} href=${h.href.substring(0,60)}`));
  
  // Try to find and click the 조회수 순위 link properly
  const result = await page.evaluate(() => {
    // Try different selectors
    const selectors = [
      'a[href*="rank"]', 'a[href*="view"]', 'a[href*="조회"]',
      'span:has-text("조회수 순위")', 'a:has-text("조회수 순위")',
      '[class*="rank"]', '[class*="Rank"]'
    ];
    const found = [];
    selectors.forEach(sel => {
      const els = document.querySelectorAll(sel);
      if (els.length > 0) {
        els.forEach(el => {
          found.push({ sel, text: (el.textContent || '').trim().substring(0, 40), tag: el.tagName, cls: el.className.substring(0, 30) });
        });
      }
    });
    return found;
  });
  
  console.log('\nRank-related elements:');
  console.log(JSON.stringify(result, null, 2));
  
  process.exit(0);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
