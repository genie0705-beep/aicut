const { chromium } = require('playwright');
const CDP_PORT = 9224;

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  pages.forEach((p, i) => {
    const url = p.url();
    const hasForm = p.frames().some(f => f.url().includes('PostWriteForm'));
    console.log(`[${i}] ${url.substring(0, 90)} ${hasForm ? '📝' : ''}`);
  });
  b.close();
})().catch(e => console.log('ERR:', e.message));
