const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  let page = ctx.pages().find(x => x.url().includes('memorial_admin_logs'));
  if (!page) { page = await ctx.newPage(); await page.goto('file:///C:/Users/paul/.openclaw/workspace/memorial_admin_logs.html'); }
  else { await page.reload(); }
  await page.waitForTimeout(2000);
  
  if (await page.locator('#login-overlay').isVisible()) {
    await page.selectOption('#login-account', 'admin');
    await page.fill('#login-password', '1234');
    await page.click('#login-btn');
    await page.waitForTimeout(1500);
  }
  
  await page.screenshot({ path: 'admin_logs_fixed.png', fullPage: true });
  console.log('Screenshot saved');
  
  for (const pg of ['dashboard','contracts','fees','staff']) {
    await page.evaluate((pg) => {
      const btn = document.querySelector('.nav-item[data-page="' + pg + '"]');
      if (btn) btn.click();
    }, pg);
    await page.waitForTimeout(300);
    const r = await page.evaluate((pg) => {
      const s = document.querySelector('.page[data-page="' + pg + '"]');
      if (!s) return { page: pg, error: 'no section' };
      const rect = s.getBoundingClientRect();
      return { page: pg, w: Math.round(rect.width), l: Math.round(rect.left), active: s.classList.contains('active') };
    }, pg);
    console.log(JSON.stringify(r));
  }
  console.log('Done');
})();
