const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];

  // 인스타그램으로 로그인 버튼 클릭
  try { await page.goto('https://www.threads.com/', { waitUntil: 'domcontentloaded', timeout: 15000 }); } catch(e) {}
  await new Promise(r => setTimeout(r, 3000));

  // "인스타그램으로 로그인" 버튼 찾기
  const loginClicked = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a, button'));
    const btn = links.find(el =>
      el.innerText?.includes('인스타그램') || el.innerText?.includes('Instagram') ||
      el.href?.includes('instagram') || el.innerText?.includes('로그인')
    );
    if (btn) { btn.click(); return btn.innerText?.trim() || btn.href; }
    return null;
  });
  console.log('로그인 버튼:', loginClicked);
  await new Promise(r => setTimeout(r, 4000));

  console.log('URL after click:', page.url());
  const text = await page.evaluate(() => document.body.innerText.substring(0, 300));
  console.log('텍스트:', text);

  await b.close();
})().catch(e => console.error('ERR:', e.message));
