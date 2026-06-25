const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  
  console.log('=== Current Tabs ===');
  for (let i = 0; i < pages.length; i++) {
    const url = pages[i].url();
    const title = await pages[i].title().catch(() => '');
    console.log(`[${i}] ${title.substring(0, 60)}`);
    console.log(`    ${url.substring(0, 200)}`);
  }
  
  await browser.close();
})();
