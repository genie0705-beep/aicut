const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];
  page.on('dialog', async d => d.dismiss().catch(() => {}));

  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 4000));

  // 첫 번째 입찰가 버튼 클릭
  await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    const row = rows[1];
    const bidBtn = row?.querySelector('.ad-cms-btn-link');
    if (bidBtn) bidBtn.click();
  });

  // 클릭 후 변화 관찰
  for (let i = 0; i < 10; i++) {
    await new Promise(r => setTimeout(r, 300));
    const state = await page.evaluate(() => {
      const active = document.activeElement;
      const popover = document.querySelector('[class*="popover"], [class*="popup"], [role="dialog"]');
      const numInputs = Array.from(document.querySelectorAll('input[type="number"]')).filter(n => n.offsetParent !== null);
      const tbodyInputs = Array.from(document.querySelectorAll('tbody input')).filter(n => n.offsetParent !== null && n.type !== 'checkbox' && n.type !== 'radio');
      return {
        active: (active?.tagName || '') + ':' + (active?.type || '') + ':' + (active?.value || ''),
        popover: popover?.className?.substring(0, 50) || null,
        numInputs: numInputs.map(n => n.value),
        tbodyInputs: tbodyInputs.length,
        tbodyInputVals: tbodyInputs.map(n => n.type + ':' + n.value)
      };
    });
    console.log(JSON.stringify(state));
    if (state.numInputs.length > 0 || state.tbodyInputs > 0) {
      console.log('입력창 발견!');
      break;
    }
  }

  await b.close();
})().catch(e => console.error('ERR:', e.message));
