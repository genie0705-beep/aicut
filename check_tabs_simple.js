const { chromium } = require('playwright');
const CDP_PORT = 9224;

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  ctx.pages().forEach((p, i) => console.log(`[${i}] ${p.url().substring(0, 100)}`));
  b.close();
})().catch(e => console.log('ERR:', e.message));
