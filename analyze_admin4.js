const { chromium } = require('playwright');

(async () => {
  try {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
    const ctx = browser.contexts()[0];
    let page = ctx.pages().find(p => p.url().includes('memorial_admin'));
    if (!page) {
      page = await ctx.newPage();
      await page.goto('file:///C:/Users/paul/.openclaw/workspace/memorial_admin.html', { waitUntil: 'commit' });
      await page.waitForTimeout(5000);  // Wait for fonts/CDN
    }
    
    await page.waitForTimeout(2000);
    
    // Check login
    if (await page.locator('#login-overlay').isVisible()) {
      await page.selectOption('#login-account', 'admin');
      await page.fill('#login-password', '1234');
      await page.click('#login-btn');
      await page.waitForTimeout(2000);
    }
    
    // Reload the page fresh
    await page.reload({ waitUntil: 'commit' });
    await page.waitForTimeout(3000);
    
    // Login again
    if (await page.locator('#login-overlay').isVisible()) {
      await page.selectOption('#login-account', 'admin');
      await page.fill('#login-password', '1234');
      await page.click('#login-btn');
      await page.waitForTimeout(2000);
    }
    
    // Now take the screenshot
    await page.screenshot({ path: 'admin_reload.png', fullPage: true });
    console.log('Screenshot taken after reload');
    
    // Get the real layout values
    const info = await page.evaluate(() => {
      const sidebar = document.querySelector('.sidebar');
      const mainDiv = document.querySelector('.main');
      const content = document.querySelector('#content');
      const dash = document.querySelector('.page[data-page="dashboard"]');
      
      const getRect = (el) => {
        if (!el) return 'null';
        const r = el.getBoundingClientRect();
        return `${Math.round(r.width)}x${Math.round(r.height)} at (${Math.round(r.left)},${Math.round(r.top)})`;
      };
      
      return {
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        sidebar: getRect(sidebar),
        mainDiv: getRect(mainDiv),
        content: getRect(content),
        dash: getRect(dash),
        dashVisible: dash ? window.getComputedStyle(dash).display : 'no dash',
        mainWidth: mainDiv ? window.getComputedStyle(mainDiv).width : 'no main',
      };
    });
    
    console.log('=== Layout Info ===');
    console.log(JSON.stringify(info, null, 2));
    
    // Also check if the fee list items are visible
    const feeCheck = await page.evaluate(() => {
      const feeList = document.getElementById('dash-fee-list');
      if (!feeList) return {error: 'no dash-fee-list'};
      return {
        parentTag: feeList.parentElement.tagName,
        parentDisplay: window.getComputedStyle(feeList.parentElement).display,
        parentWidth: Math.round(feeList.parentElement.getBoundingClientRect().width),
        feeListDisplay: window.getComputedStyle(feeList).display,
        feeListWidth: Math.round(feeList.getBoundingClientRect().width),
        feeRows: feeList.querySelectorAll('.fee-row').length
      };
    });
    console.log('=== Fee list check ===');
    console.log(JSON.stringify(feeCheck, null, 2));
    
  } catch (e) {
    console.error('Error:', e.message);
  }
})();
