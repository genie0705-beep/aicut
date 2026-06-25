const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];
  page.on('dialog', async d => d.dismiss().catch(() => {}));
  try { await page.goto('https://www.threads.com/', { waitUntil: 'domcontentloaded', timeout: 15000 }); } catch(e) {}
  await new Promise(r => setTimeout(r, 4000));

  // 새로운 스레드 버튼 클릭
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
    const btn = btns.find(b => b.innerText?.trim() === '새로운 스레드');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  const editable = await page.evaluate(() =>
    Array.from(document.querySelectorAll('[contenteditable]')).map(e => ({
      ph: e.getAttribute('aria-placeholder') || '',
      visible: e.offsetParent !== null,
      text: e.innerText?.trim().substring(0, 30)
    }))
  );
  console.log('editable:', JSON.stringify(editable, null, 2));

  // 더 넓은 검색
  const inputs = await page.evaluate(() => {
    const all = document.querySelectorAll('textarea, input, [role="textbox"]');
    return Array.from(all).map(e => ({tag: e.tagName, ph: e.getAttribute('placeholder') || e.getAttribute('aria-placeholder') || ''}));
  });
  console.log('other inputs:', JSON.stringify(inputs));
  await b.close();
})().catch(e => console.error(e.message));
