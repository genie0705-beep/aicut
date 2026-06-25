const { chromium } = require('playwright');

(async () => {
  try {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
    const ctx = browser.contexts()[0];
    let page = ctx.pages().find(p => p.url().includes('memorial_admin'));
    if (!page) {
      page = await ctx.newPage();
      await page.goto('file:///C:/Users/paul/.openclaw/workspace/memorial_admin.html', { waitUntil: 'commit' });
      await page.waitForTimeout(3000);
    }
    
    // Login quietly
    if (await page.locator('#login-overlay').isVisible()) {
      await page.selectOption('#login-account', 'admin');
      await page.fill('#login-password', '1234');
      await page.click('#login-btn');
      await page.waitForTimeout(1500);
    }
    
    // Get actual computed styles
    const styles = await page.evaluate(() => {
      const els = {
        main: document.querySelector('#content'),
        sidebar: document.querySelector('.sidebar'),
        dashSection: document.querySelector('.page[data-page="dashboard"]'),
        kpiGrid: document.querySelector('.kpi-grid'),
        flexContainer: document.querySelector('.page[data-page="dashboard"] > div:nth-child(3)'),
        innerFlex: document.querySelector('.page[data-page="dashboard"] > div:nth-child(3) > div'),
        grid2col: document.querySelector('.grid-2col'),
        feeCard: document.querySelector('#dash-fee-list')?.closest('.card'),
        taskCard: document.querySelector('#dash-task-list')?.closest('.card'),
        memorialCard: document.querySelector('#dash-memorial-list')?.closest('.card'),
      };
      
      const result = {};
      for (const [key, el] of Object.entries(els)) {
        if (!el) { result[key] = 'NOT FOUND'; continue; }
        const s = window.getComputedStyle(el);
        const r = el.getBoundingClientRect();
        result[key] = {
          display: s.display,
          width: s.width,
          rectW: Math.round(r.width),
          rectL: Math.round(r.left),
          rectT: Math.round(r.top),
          position: s.position,
          flex: s.flex || 'none',
          overflow: s.overflow
        };
      }
      return result;
    });
    
    console.log('=== Computed Styles ===');
    console.log(JSON.stringify(styles, null, 2));
    
    // Check if fee rows on dashboard appear as "extra panel"
    const feeInfo = await page.evaluate(() => {
      const feeList = document.getElementById('dash-fee-list');
      if (!feeList) return {error: 'no fee list'};
      
      const rows = feeList.querySelectorAll('.fee-row');
      const feeData = [];
      rows.forEach(r => {
        const borderLeft = r.style.borderLeftColor || window.getComputedStyle(r).borderLeftColor;
        const nameEl = r.querySelector('.fee-name');
        const badge = r.querySelector('[data-role="status-badge"]');
        feeData.push({
          name: nameEl?.textContent || '',
          badge: badge?.textContent || '',
          borderColor: borderLeft,
          rect: r.getBoundingClientRect()
        });
      });
      return feeData;
    });
    console.log('=== Fee rows on dashboard ===');
    console.log(JSON.stringify(feeInfo, null, 2));
    
    // Take a clean screenshot
    await page.screenshot({ path: 'admin_debug.png', fullPage: true });
    console.log('Debug screenshot saved');
    
  } catch (e) {
    console.error('Error:', e.message);
  }
})();
