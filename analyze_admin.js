const { chromium } = require('playwright');

(async () => {
  try {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
    const defaultCtx = browser.contexts()[0];
    const page = defaultCtx.pages().find(p => p.url().includes('memorial_admin'));
    
    if (!page) {
      console.log('Target page not found, creating new tab...');
      const newPage = await defaultCtx.newPage();
      await newPage.goto('file:///C:/Users/paul/.openclaw/workspace/memorial_admin.html', { waitUntil: 'networkidle' });
      await newPage.waitForTimeout(2000);
      
      // Check login page
      const loginVisible = await newPage.locator('#login-overlay').isVisible();
      console.log(`Login overlay visible: ${loginVisible}`);
      
      if (loginVisible) {
        // Auto-login
        await newPage.fill('#login-password', '1234');
        await newPage.click('#login-btn');
        await newPage.waitForTimeout(1000);
      }
      
      // Take screenshot
      await newPage.screenshot({ path: 'admin_dashboard.png', fullPage: true });
      console.log('Dashboard screenshot saved');
      
      // Get dashboard elements
      const dashboardHTML = await newPage.evaluate(() => {
        const dash = document.querySelector('[data-page="dashboard"]');
        return dash ? dash.innerHTML.substring(0, 3000) : 'No dashboard found';
      });
      console.log('--- Dashboard HTML (first 3K) ---');
      console.log(dashboardHTML);
      
      // Check for any right-side panels
      const rightPanels = await newPage.evaluate(() => {
        const panels = [];
        document.querySelectorAll('[style*="right:0"]').forEach(el => {
          panels.push({
            id: el.id,
            className: el.className,
            display: window.getComputedStyle(el).display,
            width: el.style.width,
            visible: el.style.display !== 'none'
          });
        });
        return panels;
      });
      console.log('--- Right panels ---');
      console.log(JSON.stringify(rightPanels, null, 2));
      
      // Check nav items and page structure
      const pageInfo = await newPage.evaluate(() => {
        const pages = [];
        document.querySelectorAll('.page').forEach(p => {
          pages.push({
            page: p.dataset.page,
            active: p.classList.contains('active'),
            childCount: p.children.length
          });
        });
        return pages;
      });
      console.log('--- Page structure ---');
      console.log(JSON.stringify(pageInfo, null, 2));
      
      // Check fee-related elements everywhere
      const feeLeaks = await newPage.evaluate(() => {
        const leaks = [];
        document.querySelectorAll('.page:not([data-page="dashboard"]):not([data-page="fees"])').forEach(p => {
          const feeEls = p.querySelectorAll('#dash-fee-list, #fee-list, .fee-row, [class*="fee"]');
          if (feeEls.length > 0) {
            leaks.push({ page: p.dataset.page, count: feeEls.length });
          }
        });
        return leaks;
      });
      console.log('--- Fee component leaks ---');
      console.log(JSON.stringify(feeLeaks, null, 2));
      
      await browser.disconnect();
      console.log('Done');
    } else {
      console.log('Found existing page:', page.url());
      
      // Check login state
      const loginVisible = await page.locator('#login-overlay').isVisible();
      console.log(`Login overlay visible: ${loginVisible}`);
      
      if (loginVisible) {
        await page.fill('#login-password', '1234');
        await page.click('#login-btn');
        await page.waitForTimeout(1000);
      }
      
      // Take screenshot
      await page.screenshot({ path: 'admin_full.png', fullPage: true });
      console.log('Screenshot saved');
      
      // Full analysis
      const analysis = await page.evaluate(() => {
        // Check dashboard
        const dash = document.querySelector('[data-page="dashboard"]');
        const fees = document.querySelector('[data-page="fees"]');
        
        // Find anything that looks like the "관리비 추가 현황 예정" panel
        const allElements = document.querySelectorAll('*');
        const matches = [];
        allElements.forEach(el => {
          const text = el.textContent.trim();
          if (text.includes('관리비') && text.includes('추가') && text.includes('현황')) {
            matches.push({
              tag: el.tagName,
              id: el.id,
              class: el.className,
              text: text.substring(0, 100),
              page: el.closest('.page')?.dataset?.page || 'unknown'
            });
          }
        });
        
        return {
          dashboardActive: dash?.classList.contains('active'),
          feesActive: fees?.classList.contains('active'),
          dashboardWidth: dash?.style?.width || 'auto',
          matchingElements: matches,
          dashboardHTML: dash?.innerHTML?.substring(0, 2000) || '',
          totalPages: document.querySelectorAll('.page').length
        };
      });
      console.log('--- Analysis ---');
      console.log(JSON.stringify(analysis, null, 2));
      
      await browser.disconnect();
    }
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
