const { chromium } = require('playwright');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page = pages.find(p => p.url().includes('miricanvas.com') && p.url().includes('design'));

  await sleep(1000);
  await page.screenshot({ path: 'miri_current.png', fullPage: false });
  console.log('스크린샷 저장: miri_current.png');

  await b.close();
})().catch(e => console.error('Error:', e.message))
.finally(() => setTimeout(() => process.exit(0), 1000));
