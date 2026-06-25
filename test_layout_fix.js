const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  let page = ctx.pages().find(x => x.url().includes('memorial_admin_logs'));
  if (!page) {
    page = await ctx.newPage();
    await page.goto('file:///C:/Users/paul/.openclaw/workspace/memorial_admin_logs.html', { waitUntil: 'networkidle' });
  } else {
    await page.reload({ waitUntil: 'networkidle' });
  }
  await page.waitForTimeout(2000);
  
  // Login if needed
  if (await page.locator('#login-overlay').isVisible()) {
    await page.selectOption('#login-account', 'admin');
    await page.fill('#login-password', '1234');
    await page.click('#login-btn');
    await page.waitForTimeout(1500);
  }
  
  // Dashboard layout
  const info = await page.evaluate(() => {
    const main = document.querySelector('.main');
    const content = document.querySelector('#content');
    const dash = document.querySelector('.page[data-page="dashboard"]');
    return {
      mainRect: main ? Math.round(main.getBoundingClientRect().width) + 'x' + Math.round(main.getBoundingClientRect().height) : 'none',
      contentRect: content ? Math.round(content.getBoundingClientRect().width) + 'x' + Math.round(content.getBoundingClientRect().height) : 'none',
      dashRect: dash ? Math.round(dash.getBoundingClientRect().width) + 'x' + Math.round(dash.getBoundingClientRect().height) : 'none',
      dashVisible: dash?.classList.contains('active')
    };
  });
  console.log('Layout:', JSON.stringify(info));
  
  // Cross-check all pages
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
      if (!s) return { page: pg, error: 'not found' };
      const rect = s.getBoundingClientRect();
      const mainRect = document.querySelector('.main')?.getBoundingClientRect();
      const withinBounds = mainRect ? (rect.left >= mainRect.left - 1 && rect.right <= mainRect.right + 1) : true;
      return {
        page: pg,
        active: s.classList.contains('active'),
        width: Math.round(rect.width),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        mainRight: mainRect ? Math.round(mainRect.right) : 0,
        withinMain: withinBounds,
        contentLen: s.textContent.length
      };
    }, pg);
    results.push(r);
  }
  
  console.log('\nCross-check:');
  results.forEach(r => console.log(JSON.stringify(r)));
  const issues = results.filter(r => !r.withinMain || !r.active);
  if (issues.length === 0) {
    console.log('\n✅ ALL PAGES CORRECTLY CONTAINED!');
  } else {
    console.log('\n❌ Issues:', issues.length);
  }
})();
