const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];

  await page.setExtraHTTPHeaders({});
  await page.setViewportSize({ width: 1400, height: 900 });

  // 이동 시도 - 어떤 waitUntil에도 견고하게
  await Promise.race([
    page.goto('https://www.instagram.com/merci_yoni/', { waitUntil: 'commit', timeout: 15000 }),
    new Promise(r => setTimeout(r, 8000))
  ]).catch(() => {});

  // URL이 목적지로 안정화될 때까지 최대 10초 폴링
  let stable = false;
  for (let i = 0; i < 10; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const url = page.url();
    if (url.includes('merci_yoni')) { stable = true; break; }
  }
  console.log('URL stable:', page.url());

  // 버튼 폴링 (최대 6초)
  let btns = [];
  for (let i = 0; i < 6; i++) {
    await new Promise(r => setTimeout(r, 1000));
    try {
      btns = await page.evaluate(() =>
        Array.from(document.querySelectorAll('button')).map(b=>b.innerText.trim()).filter(Boolean)
      );
      if (btns.length > 0) break;
    } catch(e) {}
  }
  console.log('버튼:', btns);

  await b.close();
})().catch(e => console.error('ERR:', e.message));
