const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const page = pages[3];

  // GA4 이벤트 목록 페이지로 이동
  console.log('GA4 이벤트 페이지 이동...');
  await page.goto(
    'https://analytics.google.com/analytics/web/#/a227543683p538910436/admin/events',
    { waitUntil: 'domcontentloaded', timeout: 20000 }
  );
  await sleep(5000);

  const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 3000));
  console.log('페이지 내용:\n', bodyText);

  await b.close();
})().catch(e => console.error(e.message.split('\n')[0]));
