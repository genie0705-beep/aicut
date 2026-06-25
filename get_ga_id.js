const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const page = pages[3]; // GA 탭

  // 관리 → 데이터 스트림으로 이동
  await page.goto(
    'https://analytics.google.com/analytics/web/#/a227543683p538910436/admin/streams/table/',
    { waitUntil: 'domcontentloaded', timeout: 20000 }
  );
  await sleep(4000);

  const text = await page.evaluate(() => document.body.innerText.substring(0, 2000));
  console.log(text);

  await b.close();
})().catch(e => console.error(e.message.split('\n')[0]));
