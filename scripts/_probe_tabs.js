const { chromium } = require('playwright');
(async () => {
  try {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
    const ctx = browser.contexts()[0];
    const pages = ctx.pages();
    console.log('총 탭 수:', pages.length);
    pages.forEach((p, i) => {
      const u = p.url();
      console.log(`[${i}] ${u.substring(0, 200)}`);
    });
    browser.disconnect();
  } catch(e) {
    console.error('ERR:', e.message);
    process.exit(1);
  }
})();
