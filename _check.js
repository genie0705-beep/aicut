const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  let ep = null;
  for (const p of pages) { if (p.url().includes('PostWrite') || p.url().includes('postwrite')) { ep = p; break; } }
  if (!ep) { b.close(); return; }
  const text = await ep.evaluate(() => SmartEditor._editors['blogpc001'].getContentText());
  console.log(text);
  b.close();
})();
