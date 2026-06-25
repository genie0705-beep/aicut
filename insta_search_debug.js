const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];

  // 1. DM inbox에서 새 메시지 버튼 클릭
  await page.goto('https://www.instagram.com/direct/inbox/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 2500));

  await page.evaluate(() => {
    const svgs = Array.from(document.querySelectorAll('svg[aria-label="새로운 메시지"]'));
    for (const svg of svgs) {
      const btn = svg.closest('button') || svg.closest('[role="button"]') || svg.parentElement;
      if (btn) { btn.click(); return; }
    }
  });
  await new Promise(r => setTimeout(r, 2000));

  // 2. 이미 팔로우한 consomme_mkt 검색
  await page.focus('input[name="searchInput"]');
  await page.keyboard.press('Control+a');
  await page.keyboard.press('Backspace');
  await page.keyboard.type('consomme_mkt', { delay: 100 });
  await new Promise(r => setTimeout(r, 4000)); // 4초 대기

  // 검색 결과 확인
  const results = await page.evaluate(() => {
    const opts = Array.from(document.querySelectorAll('[role="option"]'));
    return opts.map(o => o.innerText.trim());
  });
  console.log('Search results:', JSON.stringify(results.slice(0, 5)));

  // 전체 DOM에서 consomme_mkt 포함 요소 찾기
  const found = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('*'));
    return all.filter(el => el.innerText && el.innerText.trim() === 'consomme_mkt' && el.children.length === 0)
      .map(el => ({ tag: el.tagName, class: el.className.substring(0, 50) }))
      .slice(0, 5);
  });
  console.log('consomme_mkt elements:', JSON.stringify(found));

  await b.close();
})().catch(e => console.error('ERR:', e.message));
