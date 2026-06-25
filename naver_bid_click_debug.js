const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];
  page.on('dialog', async d => d.dismiss().catch(() => {}));

  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 4000));

  // 1페이지 첫 번째 키워드의 입찰가 버튼 클릭
  const bidBtns = await page.evaluate(`
    (() => {
      const rows = Array.from(document.querySelectorAll('tbody tr'));
      const row = rows[1]; // 두 번째 행
      if (!row) return null;
      const kw = row.querySelector('td:nth-child(3)')?.innerText?.trim().split('\\n')[0];
      const bidBtn = row.querySelector('.ad-cms-btn-link');
      return { kw, bidText: bidBtn?.innerText?.trim() };
    })()
  `);
  console.log('클릭 대상:', bidBtns);

  // 클릭
  await page.evaluate(`
    (() => {
      const rows = Array.from(document.querySelectorAll('tbody tr'));
      const row = rows[1];
      const bidBtn = row?.querySelector('.ad-cms-btn-link');
      if (bidBtn) bidBtn.click();
    })()
  `);

  // 100ms 간격으로 DOM 변화 관찰
  for (let i = 0; i < 10; i++) {
    await new Promise(r => setTimeout(r, 300));
    const state = await page.evaluate(`
      (() => {
        const active = document.activeElement;
        const popover = document.querySelector('[class*="popover"], [class*="popup"], [role="dialog"], [class*="modal"]');
        const numInputs = Array.from(document.querySelectorAll('input[type="number"]')).filter(i => i.offsetParent !== null);
        const textInputsNear = Array.from(document.querySelectorAll('tbody input')).filter(i => i.offsetParent !== null);
        return {
          t: ${i * 300}ms,
          active: active?.tagName + ':' + active?.type + ':' + active?.value,
          popover: popover?.className?.substring(0, 50),
          numInputs: numInputs.map(i => i.value),
          tbodyInputs: textInputsNear.length
        };
      })()
    `);
    console.log(JSON.stringify(state));
    if (state.numInputs?.length > 0 || state.tbodyInputs > 0) break;
  }

  await b.close();
})().catch(e => console.error('ERR:', e.message));
