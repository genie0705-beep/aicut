const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];

  console.log('URL:', page.url());
  console.log('Title:', await page.title());

  const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 3000));
  console.log('\n--- 페이지 내용 ---');
  console.log(bodyText);

  await b.close();
})().catch(e => console.error(e.message.split('\n')[0]));
