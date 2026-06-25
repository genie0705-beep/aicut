const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];
  console.log('UA:', await page.evaluate(() => navigator.userAgent));
  console.log('Pages:', ctx.pages().length);

  // merci_yoni 방문
  await Promise.race([
    page.goto('https://www.instagram.com/merci_yoni/', { waitUntil: 'commit', timeout: 12000 }),
    new Promise(r => setTimeout(r, 8000))
  ]).catch(() => {});

  // URL 안정화 대기
  for (let i = 0; i < 8; i++) {
    await new Promise(r => setTimeout(r, 1000));
    if (page.url().includes('merci_yoni')) break;
  }
  console.log('URL:', page.url());

  // 버튼 폴링
  let btns = [];
  for (let i = 0; i < 6; i++) {
    await new Promise(r => setTimeout(r, 1000));
    try {
      btns = await page.evaluate(() =>
        Array.from(document.querySelectorAll('button')).map(b=>b.innerText.trim()).filter(Boolean)
      );
      if (btns.length > 0) break;
    } catch(e) { console.log('eval err:', e.message.split('\n')[0]); }
  }
  console.log('버튼:', btns);
  await b.close();
})().catch(e => console.error('ERR:', e.message));
