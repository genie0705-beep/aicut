const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];
  await page.setViewportSize({ width: 1400, height: 900 });

  // merci_yoni - 일반 계정으로 테스트
  try {
    await page.goto('https://www.instagram.com/merci_yoni/', { waitUntil: 'networkidle', timeout: 20000 });
  } catch(e) { await new Promise(r => setTimeout(r, 2000)); }

  const btns = await page.evaluate(() =>
    Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean)
  );
  console.log('버튼:', btns);

  const hasMsgBtn = btns.some(b => b.includes('메시지'));
  console.log('메시지 버튼:', hasMsgBtn);

  if (hasMsgBtn) {
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('메시지'));
      if (btn) btn.click();
    });
    console.log('클릭 완료');

    try { await page.waitForLoadState('networkidle', { timeout: 10000 }); } catch(e) {}
    await new Promise(r => setTimeout(r, 2000));

    const url = page.url();
    console.log('URL:', url);

    // 입력창
    const selectors = [
      'div[role="textbox"][contenteditable="true"]',
      'p[aria-placeholder="메시지 입력..."]',
      'div[aria-placeholder="메시지 입력..."]',
      'textarea',
      'div[contenteditable="true"]',
    ];
    let found = null;
    for (const sel of selectors) {
      try {
        const el = await page.waitForSelector(sel, { timeout: 3000, state: 'visible' });
        if (el) { found = sel; break; }
      } catch(e) {}
    }
    console.log('입력창:', found);
  }

  await b.close();
})().catch(e => console.error('ERR:', e.message));
