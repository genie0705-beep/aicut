const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const page = pages[4];

  await page.goto('https://www.instagram.com/aicut.official/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await sleep(4000);
  await page.screenshot({ path: 'C:/Users/paul/.openclaw/workspace/aicut_insta_profile.png' });
  await b.close();
})().catch(e => console.error(e.message.split('\n')[0]));
