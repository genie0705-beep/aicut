const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];
  page.on('dialog', async d => d.dismiss().catch(() => {}));

  try { 
    await page.goto('https://www.threads.net/@aicut.official', { waitUntil: 'domcontentloaded', timeout: 20000 }); 
  } catch(e) { console.log('goto err:', e.message); }
  await new Promise(r => setTimeout(r, 5000));

  const pageInfo = await page.evaluate(() => ({
    url: location.href,
    title: document.title,
    text: document.body.innerText?.substring(0, 500)
  }));
  console.log('URL:', pageInfo.url);
  console.log('Title:', pageInfo.title);
  
  // Find post button
  const btnInfo = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, [role="button"], a'));
    return btns.map(b => ({
      text: b.innerText?.trim().substring(0, 40),
      aria: b.getAttribute('aria-label') || '',
      href: b.getAttribute('href') || '',
      visible: b.offsetParent !== null
    })).filter(b => b.visible && (b.text || b.aria));
  });
  console.log('Buttons:', JSON.stringify(btnInfo, null, 2));

  await b.close();
})().catch(e => console.log('ERR:', e.message));
