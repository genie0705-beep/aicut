const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];
  page.on('dialog', async d => d.dismiss().catch(() => {}));

  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 4000));

  // 첫 행 입찰가 버튼 좌표 확인
  const btnRect = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    const row = rows[1];
    const bidBtn = row?.querySelector('.ad-cms-btn-link');
    if (bidBtn) {
      const r = bidBtn.getBoundingClientRect();
      return { x: r.x + r.width/2, y: r.y + r.height/2, text: bidBtn.innerText.trim() };
    }
    return null;
  });
  console.log('입찰가 버튼 위치:', btnRect);

  if (btnRect) {
    // 실제 마우스 클릭
    await page.mouse.click(btnRect.x, btnRect.y);
    await new Promise(r => setTimeout(r, 1500));

    // 팝오버/모달 확인
    const after = await page.evaluate(() => {
      const allVisible = Array.from(document.querySelectorAll('[class*="popover"] *, [role="tooltip"] *, [class*="tooltip"] *'))
        .filter(e => e.offsetParent !== null)
        .map(e => e.innerText?.trim()).filter(Boolean).slice(0, 10);
      const numInputs = Array.from(document.querySelectorAll('input[type="number"]')).filter(n => n.offsetParent !== null);
      const newElements = Array.from(document.querySelectorAll('[data-floating], [class*="float"], [class*="overlay"], [class*="modal"]'))
        .filter(e => e.offsetParent !== null)
        .map(e => e.innerText?.trim().substring(0, 50));
      return { allVisible, numInputs: numInputs.map(n => ({val: n.value, id: n.id})), newElements };
    });
    console.log('클릭 후:', JSON.stringify(after, null, 2));

    // 스크린샷
    await page.screenshot({ path: 'C:/Users/paul/.openclaw/workspace/blog_images/naver_bid_click.png' });
    console.log('스크린샷 저장됨');
  }

  await b.close();
})().catch(e => console.error('ERR:', e.message));
