const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page = pages.find(p => p.url().includes('miricanvas.com'));
  await new Promise(r => setTimeout(r, 1000));

  const info = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, [role="button"]'))
      .map(el => ({ text: el.innerText.trim().substring(0, 40), cls: el.className.substring(0, 50) }))
      .filter(el => el.text)
      .slice(0, 30);
    return btns;
  });
  console.log(JSON.stringify(info, null, 2));
  await b.close();
})().catch(e => console.error(e.message))
.finally(() => setTimeout(() => process.exit(0), 1000));
