const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];

  await page.goto('https://www.instagram.com/direct/inbox/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 3000));

  // "새로운 메시지" SVG 버튼 클릭
  const newMsgClicked = await page.evaluate(() => {
    const svgs = Array.from(document.querySelectorAll('svg[aria-label="새로운 메시지"]'));
    console.log('svg count:', svgs.length);
    for (const svg of svgs) {
      const btn = svg.closest('button') || svg.closest('[role="button"]') || svg.parentElement;
      if (btn) { btn.click(); return 'clicked'; }
    }
    return 'not_found';
  });
  console.log('New msg clicked:', newMsgClicked);
  await new Promise(r => setTimeout(r, 2500));

  // 검색창 상태
  const inputState = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input'));
    return inputs.map(i => ({
      placeholder: i.placeholder,
      name: i.name,
      visible: i.offsetParent !== null,
      disabled: i.disabled,
      rect: (() => { const r = i.getBoundingClientRect(); return {x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height)}; })()
    }));
  });
  console.log('Inputs:', JSON.stringify(inputState, null, 2));

  // 직접 keyboard로 찾아서 타이핑
  if (inputState.some(i => i.name === 'searchInput' && i.visible)) {
    await page.focus('input[name="searchInput"]');
    await page.keyboard.type('consomme_mkt', { delay: 80 });
    await new Promise(r => setTimeout(r, 2500));

    const results = await page.evaluate(() => {
      const opts = Array.from(document.querySelectorAll('[role="option"]'));
      return opts.map(o => o.innerText.trim().substring(0, 50));
    });
    console.log('Search results:', results);
  }

  await b.close();
})().catch(e => console.error('ERR:', e.message));
