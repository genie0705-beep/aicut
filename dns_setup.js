const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  let pages = ctx.pages();
  let page = null;
  for (let i = 0; i < pages.length; i++) {
    if (pages[i].url().includes('app.hosting.kr')) {
      page = pages[i];
      break;
    }
  }
  if (!page) {
    console.log('No app.hosting.kr page found');
    await b.close();
    return;
  }

  await page.bringToFront();
  await page.goto('https://app.hosting.kr/domains/portfolio/owned', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 3000));

  // Try to find and click on aicut.co.kr row
  const result = await page.evaluate(() => {
    // Look for any clickable element containing aicut.co.kr
    const allElements = document.querySelectorAll('tr, td, div, span, a');
    for (const el of allElements) {
      if (el.innerText.trim() === 'aicut.co.kr' && el.offsetParent !== null) {
        el.click();
        return 'clicked: ' + el.tagName;
      }
    }
    // Try parent row
    for (const el of allElements) {
      if (el.innerText.includes('aicut.co.kr') && el.offsetParent !== null) {
        const row = el.closest('tr') || el.closest('[role="row"]') || el.parentElement;
        if (row) {
          row.click();
          return 'clicked row via parent: ' + row.tagName;
        }
        el.click();
        return 'clicked element: ' + el.tagName;
      }
    }
    return 'aicut.co.kr not found in any element';
  });

  console.log('Result:', result);
  await new Promise(r => setTimeout(r, 3000));

  const newUrl = await page.url();
  console.log('URL after click:', newUrl);

  // Check page content
  const txt = await page.evaluate(() => document.body.innerText.substring(0, 2000).replace(/\n/g, ' ').trim());
  console.log('Content:', txt.substring(0, 600));

  await b.close();
})().catch(e => console.log('ERR:', e.message));
