const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const page = pages[3]; // Google Analytics 탭

  console.log('URL:', page.url());
  console.log('Title:', await page.title());
  await sleep(2000);

  const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 5000));
  console.log('\n--- GA 내용 ---');
  console.log(bodyText);

  await b.close();
})().catch(e => console.error(e.message.split('\n')[0]));
