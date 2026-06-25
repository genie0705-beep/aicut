const { chromium } = require('playwright');

// Threads 메시지 보내기 버튼 테스트
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];

  await page.goto('https://www.threads.com/@frame__marketing', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 4000));

  // 메시지 보내기 버튼 클릭
  const clicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText.trim() === '메시지 보내기');
    if (btn) { btn.click(); return true; }
    return false;
  });
  console.log('메시지 버튼 클릭:', clicked);
  await new Promise(r => setTimeout(r, 4000));

  console.log('URL after click:', page.url());
  const text = await page.evaluate(() => document.body.innerText.substring(0, 300));
  console.log('텍스트:', text.substring(0, 250));

  // 입력창 확인
  const inputs = await page.evaluate(() =>
    Array.from(document.querySelectorAll('[contenteditable], textarea')).map(el => ({
      tag: el.tagName, role: el.getAttribute('role'),
      ph: el.getAttribute('aria-placeholder') || el.getAttribute('placeholder') || ''
    }))
  );
  console.log('입력창:', JSON.stringify(inputs));

  await b.close();
})().catch(e => console.error('ERR:', e.message));
