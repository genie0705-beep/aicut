const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  let pages = ctx.pages();
  let page = null;
  
  // Find Visily tab
  for (let i = 0; i < pages.length; i++) {
    if (pages[i].url().includes('visily.ai')) { page = pages[i]; break; }
  }
  if (!page) { console.log('Visily tab not found'); await b.close(); return; }

  await page.bringToFront();
  await new Promise(r => setTimeout(r, 3000));

  // Take a screenshot to see what's on the board
  await page.screenshot({ path: 'visily_board.png', fullPage: true });
  console.log('Screenshot saved as visily_board.png');

  // Get all text from the board area
  const txt = await page.evaluate(() => {
    // Try to find the canvas/board area
    const bodyText = document.body.innerText;
    // Filter for potentially relevant content about the ERP system
    const lines = bodyText.split('\n');
    return lines.filter(l => l.trim().length > 0).slice(0, 100);
  });

  console.log('\n=== Visily Board Lines ===');
  txt.forEach((l, i) => {
    if (l.trim()) console.log(i + ': ' + l.trim());
  });

  await b.close();
})().catch(e => console.log('ERR:', e.message));
