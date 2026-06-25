const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('canva.com/design'));

  await sleep(1000);
  await page.screenshot({ path: 'canva_now.png' });
  console.log('스크린샷 저장');

  await b.close();
})().catch(e=>console.error(e.message))
.finally(()=>setTimeout(()=>process.exit(0),1000));
