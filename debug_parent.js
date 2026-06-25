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
  await page.waitForTimeout(2000);
  
  if (await page.locator('#login-overlay').isVisible()) {
    await page.selectOption('#login-account', 'admin');
    await page.fill('#login-password', '1234');
    await page.click('#login-btn');
    await page.waitForTimeout(1500);
  }
  
  // Check fees parent
  const info = await page.evaluate(() => {
    const fees = document.querySelector('.page[data-page="fees"]');
    if (!fees) return { error: 'fees not found' };
    const parent = fees.parentElement;
    const grandparent = parent?.parentElement;
    return {
      feesParentTag: parent?.tagName,
      feesParentId: parent?.id,
      feesParentClasses: parent?.className,
      feesParentComputedDisplay: parent ? window.getComputedStyle(parent).display : '?',
      grandparentTag: grandparent?.tagName,
      grandparentId: grandparent?.id,
      // Check all children of #content
      contentEl: document.getElementById('content'),
      contentChildrenCount: document.getElementById('content')?.children.length,
      contentChildInfo: Array.from(document.getElementById('content')?.children || []).map(c => ({
        tag: c.tagName,
        dataPage: c.getAttribute('data-page'),
        className: c.className
      })),
      // Check if there's an extra wrapper between content and sections
      contentFirstChild: document.getElementById('content')?.firstElementChild?.tagName,
      contentFirstChildPage: document.getElementById('content')?.firstElementChild?.getAttribute('data-page')
    };
  });
  
  console.log(JSON.stringify(info, null, 2));
  
  // Now take screenshot of dashboard to confirm it's working
  await page.evaluate(() => {
    document.querySelector('.nav-item[data-page="dashboard"]')?.click();
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'logs_dash.png' });
  console.log('Dashboard screenshot saved');
  
  // Also screenshot fees after navigating
  await page.evaluate(() => {
    document.querySelector('.nav-item[data-page="fees"]')?.click();
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'logs_fees_screen.png' });
  console.log('Fees screenshot saved');
})();
