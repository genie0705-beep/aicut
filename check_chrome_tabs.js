const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222', { timeout: 5000 });
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  console.log('=== 현재 Chrome 열린 탭 ===');
  pages.forEach((p, i) => {
    console.log((i + 1) + '. ' + p.url().substring(0, 80));
  });
  await b.close();
})();
