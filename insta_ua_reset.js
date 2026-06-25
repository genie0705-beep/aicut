const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];
  // UA 완전 초기화
  await page.setExtraHTTPHeaders({});
  await page.setViewportSize({ width: 1400, height: 900 });

  try {
    await page.goto('https://www.instagram.com/merci_yoni/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  } catch(e) {}
  await new Promise(r => setTimeout(r, 4000));

  const btns = await page.evaluate(() =>
    Array.from(document.querySelectorAll('button')).map(b=>b.innerText.trim()).filter(Boolean)
  );
  console.log('버튼:', btns);
  console.log('URL:', page.url());
  await b.close();
})().catch(e => console.error(e.message));
