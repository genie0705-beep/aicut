const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('memorial_admin'));
  if (!page) {
    console.log('Page not found, creating new tab');
    const newPage = await ctx.newPage();
    await newPage.goto('file:///C:/Users/paul/.openclaw/workspace/memorial_admin.html', { waitUntil: 'networkidle' });
    await newPage.waitForTimeout(2000);
  }
  
  await page.waitForTimeout(1000);
  
  // Login if needed
  if (await page.locator('#login-overlay').isVisible()) {
    await page.selectOption('#login-account', 'admin');
    await page.fill('#login-password', '1234');
    await page.click('#login-btn');
    await page.waitForTimeout(1500);
  }
  
  // Go to dashboard
  await page.evaluate(() => {
    const btn = document.querySelector('.nav-item[data-page="dashboard"]');
    if (btn) btn.click();
  });
  await page.waitForTimeout(500);
  
  // Take screenshot
  await page.screenshot({ path: 'admin_check_now.png', fullPage: true });
  console.log('Screenshot saved: admin_check_now.png');
  
  // DETAILED dashboard content analysis
  const dashContent = await page.evaluate(() => {
    const dash = document.querySelector('.page[data-page="dashboard"]');
    if (!dash) return { error: 'No dashboard section' };
    
    // Get all text content
    const fullText = dash.textContent;
    
    // Check for specific sections
    const sections = {};
    
    // KPI section
    const kpiEls = dash.querySelectorAll('.kpi-card');
    kpiEls.forEach((el, i) => {
      const label = el.querySelector('.kpi-label')?.textContent || '';
      const value = el.querySelector('.kpi-value')?.textContent || '';
      const sub = el.querySelector('.kpi-sub')?.textContent || '';
      sections[`kpi_${i}`] = { label: label.trim(), value: value.trim(), sub: sub.trim() };
    });
    
    // Fee list
    const feeList = document.getElementById('dash-fee-list');
    if (feeList) {
      const feeRows = feeList.querySelectorAll('.fee-row');
      sections.feeItems = [];
      feeRows.forEach(row => {
        const name = row.querySelector('.fee-name')?.textContent || '';
        const badge = row.querySelector('[data-role="status-badge"]')?.textContent || '';
        const sub = row.querySelector('.fee-sub')?.textContent || '';
        const date = row.querySelector('.fee-date')?.textContent || '';
        sections.feeItems.push({ name: name.trim(), badge: badge.trim(), sub: sub.trim(), date: date.trim() });
      });
    }
    
    // Task list
    const taskList = document.getElementById('dash-task-list');
    if (taskList) {
      sections.tasks = [];
      taskList.querySelectorAll('label').forEach(label => {
        sections.tasks.push(label.textContent.trim());
      });
    }
    
    // Memorial list
    const memorialList = document.getElementById('dash-memorial-list');
    if (memorialList) {
      sections.memorials = [];
      memorialList.querySelectorAll('.fee-row').forEach(row => {
        const name = row.querySelector('.fee-name')?.textContent || '';
        sections.memorials.push(name.trim());
      });
    }
    
    // Location stats card
    const locStats = document.getElementById('dash-location-stats');
    if (locStats) {
      sections.locationStats = locStats.textContent.trim().substring(0, 200);
    }
    
    // Check page title
    const title = document.getElementById('page-title')?.textContent || '';
    
    // Check for any error messages in the page
    const bodyText = document.body.textContent;
    const hasErrors = bodyText.includes('error') || bodyText.includes('Error') || bodyText.includes('오류');
    
    // Container widths
    const viewport = { w: window.innerWidth, h: window.innerHeight };
    const mainContent = document.querySelector('#content');
    const mainRect = mainContent?.getBoundingClientRect();
    
    return {
      title,
      viewport,
      contentWidth: mainRect ? Math.round(mainRect.width) : 0,
      hasErrors,
      sections,
      fullTextPreview: fullText.substring(0, 500)
    };
  });
  
  console.log('=== Dashboard Content ===');
  console.log(JSON.stringify(dashContent, null, 2));
  
})();
