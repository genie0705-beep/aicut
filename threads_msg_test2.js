const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];

  // 현재 페이지에서 메시지 보내기 버튼 클릭
  console.log('현재 URL:', page.url());
  const btns = await page.evaluate(() =>
    Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean)
  );
  console.log('버튼:', btns);

  const clicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText.trim() === '메시지 보내기');
    if (btn) { btn.click(); return true; }
    return false;
  });
  console.log('클릭:', clicked);
  await new Promise(r => setTimeout(r, 4000));

  console.log('URL after:', page.url());
  const text = await page.evaluate(() => document.body.innerText.substring(0, 400));
  console.log('페이지:', text.substring(0, 300));

  const inputs = await page.evaluate(() =>
    Array.from(document.querySelectorAll('[contenteditable], textarea')).map(el => ({
      tag: el.tagName, role: el.getAttribute('role'),
      ph: el.getAttribute('aria-placeholder') || el.getAttribute('placeholder') || '',
      visible: el.offsetParent !== null
    }))
  );
  console.log('입력창:', JSON.stringify(inputs));

  await b.close();
})().catch(e => console.error('ERR:', e.message));
