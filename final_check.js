const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  let page = ctx.pages().find(x => x.url().includes('memorial_admin_logs'));
  if (!page) {
    page = await ctx.newPage();
    await page.goto('file:///C:/Users/paul/.openclaw/workspace/memorial_admin_logs.html');
  } else {
    await page.reload();
  }
  await page.waitForTimeout(1500);
  
  // Login
  const loginVis = await page.locator('#login-overlay').isVisible();
  console.log('Login visible:', loginVis);
  if (loginVis) {
    await page.selectOption('#login-account', 'admin');
    await page.fill('#login-password', '1234');
    await page.click('#login-btn');
    await page.waitForTimeout(1500);
  }
  
  // Test pages
  const tests = ['dashboard', 'fees', 'staff', 'settings'];
  for (const pg of tests) {
    await page.evaluate((pg) => {
      const btn = document.querySelector('.nav-item[data-page="' + pg + '"]');
      if (btn) btn.click();
    }, pg);
    await page.waitForTimeout(400);
    const r = await page.evaluate((pg) => {
      const s = document.querySelector('.page[data-page="' + pg + '"]');
      if (!s) return { page: pg, error: 'no section' };
      const rect = s.getBoundingClientRect();
      return {
        page: pg,
        active: s.classList.contains('active'),
        left: Math.round(rect.left),
        width: Math.round(rect.width),
        visibleInViewport: rect.left < window.innerWidth && rect.right > 0
      };
    }, pg);
    console.log(JSON.stringify(r));
  }
  console.log('DONE');
})();
