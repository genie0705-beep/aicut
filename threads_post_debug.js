const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];
  page.on('dialog', async d => d.dismiss().catch(() => {}));
  try { await page.goto('https://www.threads.com/', { waitUntil: 'domcontentloaded', timeout: 15000 }); } catch(e) {}
  await new Promise(r => setTimeout(r, 3000));

  const clicked = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button, [role="button"]')).find(b => b.innerText?.trim() === '새로운 스레드');
    if (btn) { btn.click(); return true; }
    return false;
  });
  console.log('clicked:', clicked);
  await new Promise(r => setTimeout(r, 2500));

  const btns = await page.evaluate(() =>
    Array.from(document.querySelectorAll('button, [role="button"]')).map(b => b.innerText?.trim()).filter(Boolean)
  );
  console.log('모달 버튼:', btns.slice(0, 20));

  // 입력창 확인
  const inputs = await page.evaluate(() =>
    Array.from(document.querySelectorAll('[contenteditable="true"], textarea')).map(e => ({
      tag: e.tagName, ph: e.getAttribute('aria-placeholder') || e.getAttribute('placeholder') || '', visible: e.offsetParent !== null
    }))
  );
  console.log('입력창:', JSON.stringify(inputs));

  await b.close();
})().catch(e => console.error(e.message));
