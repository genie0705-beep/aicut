const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];

  await page.goto('https://www.threads.com/@frame__marketing', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 4000));

  // 첫 번째 게시물의 모든 버튼 확인
  const btns = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button, [role="button"]')).map(b => ({
      text: b.innerText?.trim().substring(0,20),
      ariaLabel: b.getAttribute('aria-label'),
      svgLabel: b.querySelector('svg')?.getAttribute('aria-label')
    })).filter(b => b.text || b.ariaLabel || b.svgLabel).slice(0, 20);
  });
  console.log('버튼들:', JSON.stringify(btns, null, 2));

  // 첫 게시물 직접 링크 찾기
  const postLinks = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[href*="/post/"]')).slice(0, 3).map(a => a.href);
  });
  console.log('게시물 링크:', postLinks);

  if (postLinks.length > 0) {
    await page.goto(postLinks[0], { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(r => setTimeout(r, 3000));
    console.log('게시물 URL:', page.url());

    // 입력 가능한 요소 확인
    const inputs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[contenteditable], textarea, input[type="text"]')).map(el => ({
        tag: el.tagName,
        role: el.getAttribute('role'),
        placeholder: el.getAttribute('aria-placeholder') || el.getAttribute('placeholder') || '',
        label: el.getAttribute('aria-label') || '',
        visible: el.offsetParent !== null
      }));
    });
    console.log('입력창:', JSON.stringify(inputs, null, 2));
  }

  await b.close();
})().catch(e => console.error('ERR:', e.message));
