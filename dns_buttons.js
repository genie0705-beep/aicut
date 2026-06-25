const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  let pages = ctx.pages();
  let page = null;
  for (let i = 0; i < pages.length; i++) {
    if (pages[i].url().includes('details/aicut.co.kr/dns')) { page = pages[i]; break; }
  }
  if (!page) { console.log('Page not found'); await b.close(); return; }

  await page.bringToFront();
  await page.waitForTimeout(500);

  // Find save/confirm buttons for inline forms
  const result = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const dnsBtns = [];
    for (const b of btns) {
      if (b.offsetParent !== null) {
        const rect = b.getBoundingClientRect();
        if (rect.y > 750 && rect.y < 1300) {
          dnsBtns.push({
            text: (b.innerText || '').trim().substring(0, 20),
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            w: Math.round(rect.width),
            h: Math.round(rect.height),
            tag: b.tagName,
            hasSvg: b.querySelector('svg') !== null,
            ariaLabel: b.getAttribute('aria-label') || ''
          });
        }
      }
    }
    return dnsBtns;
  });

  console.log('DNS area buttons:');
  result.forEach(b => {
    console.log('  (' + b.x + ',' + b.y + ') ' + b.w + 'x' + b.h + ' "' + b.text + '" svg=' + b.hasSvg + ' aria="' + b.ariaLabel + '"');
  });

  await b.close();
})().catch(e => console.log('ERR:', e.message));
