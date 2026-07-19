const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  ctx.pages().forEach((p, i) => console.log(i+1 + ':', p.url().substring(0, 120)));
  await b.close();
})();
