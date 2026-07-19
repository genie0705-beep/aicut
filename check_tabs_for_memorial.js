const { chromium } = require('playwright');
const CDP_PORT = 9224;

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  pages.forEach((p, i) => {
    const url = p.url();
    const title = p.title();
    console.log(`[${i}] ${url.substring(0, 100)}`);
    if (title) console.log(`    title: ${title.substring(0, 60)}`);
  });
  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));
