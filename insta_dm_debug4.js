const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];

  await page.goto('https://www.instagram.com/direct/inbox/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 3000));

  // 새 메시지 버튼 클릭
  await page.evaluate(() => {
    const svgs = Array.from(document.querySelectorAll('svg[aria-label="새로운 메시지"]'));
    for (const svg of svgs) {
      const btn = svg.closest('button') || svg.closest('[role="button"]') || svg.parentElement;
      if (btn) { btn.click(); return; }
    }
  });
  await new Promise(r => setTimeout(r, 2000));

  // 검색창에 입력
  await page.focus('input[name="searchInput"]');
  await page.keyboard.type('consomme_mkt', { delay: 80 });
  await new Promise(r => setTimeout(r, 2500));

  // 결과 목록 확인 (username 기준)
  const results = await page.evaluate(() => {
    const opts = Array.from(document.querySelectorAll('[role="option"]'));
    return opts.map(o => ({
      text: o.innerText.trim(),
      html: o.innerHTML.substring(0, 200)
    }));
  });
  console.log('Results:', JSON.stringify(results.slice(0,5), null, 2));

  // 정확한 username 클릭 시도
  const clicked = await page.evaluate((targetUsername) => {
    const opts = Array.from(document.querySelectorAll('[role="option"]'));
    for (const opt of opts) {
      // option 내부 span들 확인
      const spans = Array.from(opt.querySelectorAll('span'));
      for (const span of spans) {
        if (span.innerText.trim() === targetUsername) {
          opt.click();
          return 'exact_span: ' + targetUsername;
        }
      }
    }
    // 없으면 첫번째
    if (opts.length > 0) {
      const txt = opts[0].innerText;
      opts[0].click();
      return 'first: ' + txt.substring(0, 50);
    }
    return false;
  }, 'consomme_mkt');
  console.log('Clicked:', clicked);
  await new Promise(r => setTimeout(r, 1000));

  // 채팅하기 버튼 클릭
  const chatClicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => ['채팅하기', 'Chat', '다음', 'Next'].includes(b.innerText.trim()));
    if (btn) { btn.click(); return btn.innerText.trim(); }
    console.log('All buttons:', btns.map(b => b.innerText.trim()).join(', '));
    return false;
  });
  console.log('Chat button:', chatClicked);
  await new Promise(r => setTimeout(r, 3000));

  // 메시지 입력창 확인
  const divs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('div[contenteditable], p[contenteditable], textarea'))
      .map(d => ({
        tag: d.tagName,
        role: d.getAttribute('role'),
        placeholder: d.getAttribute('aria-placeholder') || d.getAttribute('placeholder') || '',
        label: d.getAttribute('aria-label') || '',
        visible: d.offsetParent !== null
      }));
  });
  console.log('Editable elements:', JSON.stringify(divs, null, 2));
  console.log('Current URL:', page.url());

  await b.close();
})().catch(e => console.error('ERR:', e.message));
