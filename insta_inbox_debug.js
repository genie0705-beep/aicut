const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];

  // 인박스 이동
  try { await page.goto('https://www.instagram.com/direct/inbox/', { waitUntil: 'domcontentloaded', timeout: 15000 }); } catch(e) {}
  
  // 새로운 메시지 SVG 대기
  await page.waitForSelector('svg[aria-label="새로운 메시지"]', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 1000));
  console.log('URL after load:', page.url());

  // 새 메시지 버튼 클릭
  await page.evaluate(() => {
    const svg = document.querySelector('svg[aria-label="새로운 메시지"]');
    const btn = svg?.closest('button') || svg?.closest('[role="button"]') || svg?.parentElement;
    if (btn) btn.click();
  });

  // 검색창 waitForSelector
  const box = await page.waitForSelector('input[name="searchInput"]', { timeout: 6000 });
  console.log('Search box found:', !!box);
  console.log('URL now:', page.url());

  // page.focus() 방식 사용
  await page.focus('input[name="searchInput"]');
  console.log('Focused OK');

  await page.keyboard.type('consomme_mkt', { delay: 100 });
  await new Promise(r => setTimeout(r, 5000));

  const results = await page.evaluate(() => {
    const spans = Array.from(document.querySelectorAll('span'));
    return spans.filter(s => s.innerText.trim() === 'consomme_mkt').map(s => ({
      text: s.innerText.trim(),
      parentRole: s.parentElement?.getAttribute('role'),
      grandRole: s.parentElement?.parentElement?.getAttribute('role'),
    }));
  });
  console.log('Results:', JSON.stringify(results));
  console.log('URL after search:', page.url());

  await b.close();
})().catch(e => console.error('ERR:', e.message));
