const { chromium } = require('playwright');

(async () => {
  try {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
    const defaultCtx = browser.contexts()[0];
    let page = defaultCtx.pages().find(p => p.url().includes('memorial_admin'));
    if (!page) {
      page = await defaultCtx.newPage();
      await page.goto('file:///C:/Users/paul/.openclaw/workspace/memorial_admin.html', { waitUntil: 'networkidle' });
    }
    await page.waitForTimeout(2000);
    
    // Login if needed
    if (await page.locator('#login-overlay').isVisible()) {
      await page.selectOption('#login-account', 'admin');
      await page.fill('#login-password', '1234');
      await page.click('#login-btn');
      await page.waitForTimeout(1500);
    }
    
    await page.screenshot({ path: 'admin_dash.png', fullPage: true });
    console.log('Screenshot: admin_dash.png');
    
    // Analyze dashboard layout (.page[data-page="dashboard"])
    const dashInfo = await page.evaluate(() => {
      const dash = document.querySelector('.page[data-page="dashboard"]');
      if (!dash) return { error: 'No dashboard section found' };
      
      // Get top-level children
      const children = [];
      Array.from(dash.children).forEach((child, i) => {
        const rect = child.getBoundingClientRect();
        children.push({
          index: i, tag: child.tagName,
          classes: child.className || '',
          rect: { t: Math.round(rect.top), l: Math.round(rect.left), w: Math.round(rect.width), h: Math.round(rect.height) },
          text: (child.textContent || '').trim().substring(0, 60)
        });
      });
      
      // Check for right-panel style elements
      const rightStuff = [];
      Array.from(dash.querySelectorAll('*')).forEach(el => {
        const s = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        if (s.position === 'fixed' && s.right === '0px' && rect.width > 50) {
          rightStuff.push({ tag: el.tagName, id: el.id, cls: el.className, w: rect.width });
        }
      });
      
      // Check for 2-column fee area
      const feeContainer = document.getElementById('dash-fee-list');
      const taskContainer = document.getElementById('dash-task-list');
      const memorialContainer = document.getElementById('dash-memorial-list');
      
      return {
        children,
        viewportWidth: window.innerWidth,
        dashFeeRect: feeContainer ? { w: feeContainer.offsetWidth, h: feeContainer.offsetHeight, items: feeContainer.children.length } : null,
        dashTaskRect: taskContainer ? { w: taskContainer.offsetWidth, h: taskContainer.offsetHeight, items: taskContainer.children.length } : null,
        dashMemorialRect: memorialContainer ? { w: memorialContainer.offsetWidth, h: memorialContainer.offsetHeight, items: memorialContainer.children.length } : null,
        rightSideFixed: rightStuff
      };
    });
    console.log('=== Dashboard Info ===');
    console.log(JSON.stringify(dashInfo, null, 2));
    
    // Navigate to fees page via goPage
    await page.evaluate(() => {
      const btn = document.querySelector('.nav-item[data-page="fees"]');
      if (btn) btn.click();
    });
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'admin_fees.png', fullPage: true });
    console.log('Screenshot: admin_fees.png');
    
    // Check fees
    const feesInfo = await page.evaluate(() => {
      const fees = document.querySelector('.page[data-page="fees"]');
      const list = document.getElementById('fee-list');
      return {
        active: fees?.classList.contains('active'),
        listExists: !!list,
        listWidth: list?.offsetWidth || 0,
        rows: document.querySelectorAll('.fee-row').length,
        feeStats: document.querySelectorAll('#fee-total-amount').length > 0
      };
    });
    console.log('=== Fees Info ===');
    console.log(JSON.stringify(feesInfo, null, 2));
    
    // Navigate to newcontract
    await page.evaluate(() => goPage('newcontract'));
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'admin_newcontract.png', fullPage: true });
    console.log('Screenshot: admin_newcontract.png');
    
    const ncInfo = await page.evaluate(() => {
      const nc = document.querySelector('.page[data-page="newcontract"]');
      if (!nc) return { error: 'no newcontract page' };
      return {
        active: nc.classList.contains('active'),
        backBtnExists: !!document.getElementById('newcontract-back'),
        fields: {
          customer: !!document.getElementById('nc-customer'),
          phone: !!document.getElementById('nc-phone'),
          deceased: !!document.getElementById('nc-deceased'),
          submit: !!document.getElementById('nc-submit-btn'),
          cancel: !!document.getElementById('nc-cancel-btn')
        }
      };
    });
    console.log('=== New Contract Page ===');
    console.log(JSON.stringify(ncInfo, null, 2));
    
    // Cross-check all pages for fee leaks
    const leakResults = [];
    const pages = ['dashboard','locations','contracts','fees','sales','revenuemanage','staff','customers','notifications','logs','settings','newcontract'];
    for (const p of pages) {
      await page.evaluate((pg) => {
        const btn = document.querySelector('.nav-item[data-page="' + pg + '"]');
        if (btn) btn.click();
        else { // newcontract has no nav item
          goPage(pg);
        }
      }, p);
      await page.waitForTimeout(300);
      const leak = await page.evaluate((pg) => {
        const section = document.querySelector('.page[data-page="' + pg + '"]');
        if (!section) return { page: pg, error: 'not found' };
        return {
          page: pg,
          active: section.classList.contains('active'),
          feeRows: section.querySelectorAll('.fee-row').length,
          hasFeeList: !!section.querySelector('#fee-list'),
          hasDashFeeList: !!section.querySelector('#dash-fee-list')
        };
      }, p);
      leakResults.push(leak);
    }
    console.log('=== Cross-check: Fee Component Leaks ===');
    console.log(JSON.stringify(leakResults, null, 2));
    
    // Check logs page examples
    await page.evaluate(() => goPage('logs'));
    await page.waitForTimeout(500);
    const logsInfo = await page.evaluate(() => {
      const logsPage = document.querySelector('.page[data-page="logs"]');
      return {
        hasExampleSection: logsPage?.innerHTML?.includes('예시') || false,
        logContainerItems: document.querySelectorAll('#logs-list > div').length,
        emptyHidden: document.getElementById('logs-empty')?.style?.display === 'none'
      };
    });
    console.log('=== Logs Page ===');
    console.log(JSON.stringify(logsInfo, null, 2));
    
    console.log('\n=== ALL DONE ===');
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
