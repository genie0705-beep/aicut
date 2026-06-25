const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find(x => x.url().includes('memorial_admin_logs'));
  if (!page) return console.log('no page');
  await page.waitForTimeout(1000);
  if (await page.locator('#login-overlay').isVisible()) {
    await page.selectOption('#login-account', 'admin');
    await page.fill('#login-password', '1234');
    await page.click('#login-btn');
    await page.waitForTimeout(1000);
  }

  const pages = ['dashboard','locations','contracts','fees','sales','revenuemanage','staff','customers','notifications','logs','settings'];
  const results = [];
  for (const pg of pages) {
    await page.evaluate((pg) => {
      const btn = document.querySelector('.nav-item[data-page="' + pg + '"]');
      if (btn) btn.click();
    }, pg);
    await page.waitForTimeout(300);
    const r = await page.evaluate((pg) => {
      const s = document.querySelector('.page[data-page="' + pg + '"]');
      if (!s) return { page: pg, error: 'no section' };
      const rect = s.getBoundingClientRect();
      const vw = window.innerWidth;
      const text = s.textContent;
      const hasData = text.trim().length > 100;
      const tables = s.querySelectorAll('table').length;
      const inputs = s.querySelectorAll('input, select, button').length;
      const emptyMsg = text.includes('내역이 없습니다') || text.includes('데이터가 없습니다');
      return {
        page: pg,
        visible: rect.left < vw && rect.right > 0,
        hasContent: hasData,
        tables,
        interactive: inputs,
        hasEmptyMessage: emptyMsg
      };
    }, pg);
    results.push(r);
  }
  console.log(JSON.stringify(results, null, 2));
})();
