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
  
  // Visit each page and take screenshot + verify content
  const pages = ['fees', 'sales', 'staff', 'settings'];
  for (const pg of pages) {
    await page.evaluate((pg) => {
      const btn = document.querySelector('.nav-item[data-page="' + pg + '"]');
      if (btn) btn.click();
    }, pg);
    await page.waitForTimeout(500);
    
    // Check if content is visible on screen
    const vis = await page.evaluate((pg) => {
      const section = document.querySelector('.page[data-page="' + pg + '"]');
      if (!section) return { page: pg, error: 'no section' };
      const rect = section.getBoundingClientRect();
      const viewW = window.innerWidth;
      const viewH = window.innerHeight;
      // Check if ANY part of the section is visible in the viewport
      const isVisible = rect.left < viewW && rect.right > 0 && rect.top < viewH && rect.bottom > 0;
      // Check computed display
      const display = window.getComputedStyle(section).display;
      // Check if section has content
      const hasContent = section.textContent.trim().length > 50;
      return {
        page: pg,
        active: section.classList.contains('active'),
        display,
        rect: { left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width) },
        viewport: viewW + 'x' + viewH,
        visibleInViewport: isVisible,
        hasContent,
        contentPreview: section.textContent.trim().substring(0, 80).replace(/\n/g, ' ')
      };
    }, pg);
    console.log(pg + ':', JSON.stringify(vis));
    
    await page.screenshot({ path: 'logs_' + pg + '.png' });
  }
  
  // Also check the main container style
  const mainInfo = await page.evaluate(() => {
    const content = document.querySelector('#content');
    const main = document.querySelector('.main');
    if (!content || !main) return { error: 'containers not found' };
    return {
      contentDisplay: window.getComputedStyle(content).display,
      contentWidth: window.getComputedStyle(content).width,
      contentRect: Math.round(content.getBoundingClientRect().width),
      mainWidth: window.getComputedStyle(main).width,
      mainRect: Math.round(main.getBoundingClientRect().width),
      mainOverflow: window.getComputedStyle(main).overflow,
    };
  });
  console.log('Main container:', JSON.stringify(mainInfo));
  
  console.log('Done');
})();
