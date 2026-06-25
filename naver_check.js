const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];
  page.on('dialog', async d => d.dismiss().catch(() => {}));

  await page.goto('https://searchad.naver.com', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 4000));
  console.log('URL:', page.url());

  const text = await page.evaluate(() => document.body.innerText.substring(0, 500));
  console.log('페이지:', text.substring(0, 300));

  await b.close();
})().catch(e => console.error('ERR:', e.message));
