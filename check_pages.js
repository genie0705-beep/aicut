const { chromium } = require('playwright');

(async () => {
  try {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
    const ctx = browser.contexts()[0];
    let page = ctx.pages().find(p => p.url().includes('memorial_admin'));
    if (!page) {
      page = await ctx.newPage();
      await page.goto('file:///C:/Users/paul/.openclaw/workspace/memorial_admin.html', { waitUntil: 'networkidle' });
    }
    await page.waitForTimeout(2000);
    
    // Login if needed
    if (await page.locator('#login-overlay').isVisible()) {
      await page.selectOption('#login-account', 'admin');
      await page.fill('#login-password', '1234');
      await page.click('#login-btn');
      await page.waitForTimeout(2000);
    }
    
    // Check all pages sequentially
    const pages = ['dashboard', 'locations', 'contracts', 'fees', 'sales', 'revenuemanage', 'staff', 'customers', 'notifications', 'logs', 'settings'];
    const results = [];
    
    for (const p of pages) {
      // Navigate via evaluate
      await page.evaluate((pg) => {
        const btn = document.querySelector('.nav-item[data-page="' + pg + '"]');
        if (btn) { btn.click(); }
        else { window.goPage(pg); }
      }, p);
      await page.waitForTimeout(400);
      
      const r = await page.evaluate((pg) => {
        const section = document.querySelector('.page[data-page="' + pg + '"]');
        if (!section) return { page: pg, error: 'section NOT FOUND', status: 'FAIL' };
        
        const rect = section.getBoundingClientRect();
        const isVisible = section.classList.contains('active') && rect.width > 0;
        
        // Get content info
        const textLen = section.textContent.replace(/\\s+/g, ' ').trim().length;
        const childCount = section.children.length;
        
        // Check for error states
        const hasToast = !!document.getElementById('toast')?.textContent;
        const consoleErrors = []; // Can't easily capture console in page.evaluate
        
        return {
          page: pg,
          found: true,
          visible: isVisible,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          contentLen: textLen,
          children: childCount,
          status: isVisible && rect.width > 100 ? 'OK' : 'ISSUE',
          note: isVisible && rect.width > 100 ? '' : 'width < 100px'
        };
      }, p);
      results.push(r);
      
      // Screenshot key pages
      if (['dashboard', 'contracts', 'fees', 'notifications', 'logs'].includes(p)) {
        await page.screenshot({ path: 'page_' + p + '.png', fullPage: true });
      }
    }
    
    // Also check newcontract page (no nav-item)
    await page.evaluate(() => goPage('newcontract'));
    await page.waitForTimeout(400);
    const ncR = await page.evaluate(() => {
      const nc = document.querySelector('.page[data-page="newcontract"]');
      if (!nc) return { page: 'newcontract', status: 'FAIL', error: 'not found' };
      const rect = nc.getBoundingClientRect();
      return {
        page: 'newcontract',
        found: true,
        visible: nc.classList.contains('active'),
        width: Math.round(rect.width),
        status: rect.width > 100 ? 'OK' : 'ISSUE',
        hasBackBtn: !!document.getElementById('newcontract-back'),
        hasForm: !!document.getElementById('nc-customer')
      };
    });
    results.push(ncR);
    
    console.log('=== PAGE CHECK RESULTS ===');
    console.log(JSON.stringify(results, null, 2));
    
    // Summary
    const failed = results.filter(r => r.status !== 'OK');
    console.log(`\nTotal: ${results.length} pages`);
    if (failed.length === 0) {
      console.log('✅ ALL PAGES WORKING CORRECTLY');
    } else {
      console.log(`❌ ISSUES: ${failed.length} pages`);
      failed.forEach(f => console.log(`  - ${f.page}: ${f.note || f.error}`));
    }
    
  } catch (e) {
    console.error('Error:', e.message);
  }
})();
