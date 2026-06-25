const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];
  try {
    await page.goto('https://www.instagram.com/merci_yoni/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  } catch(e) { console.log('goto err:', e.message.split('\n')[0]); }
  await new Promise(r => setTimeout(r, 5000));
  const info = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.map(b => ({
      text: b.innerText.trim().substring(0, 40),
      aria: b.getAttribute('aria-label'),
      svgLabel: b.querySelector('svg') ? b.querySelector('svg').getAttribute('aria-label') : null
    }));
  });
  console.log('URL:', page.url());
  console.log(JSON.stringify(info, null, 2));
  await b.close();
})().catch(e => console.error(e.message));
