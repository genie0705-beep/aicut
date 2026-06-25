const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const page = pages[4];

  await page.goto('https://www.facebook.com/login', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await sleep(3000);

  console.log('URL:', page.url());
  const text = await page.evaluate(() => document.body.innerText.substring(0, 500));
  console.log(text);

  await b.close();
})().catch(e => console.error(e.message.split('\n')[0]));
