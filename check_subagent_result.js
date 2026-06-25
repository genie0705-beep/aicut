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
  
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('ERR:', msg.text().substring(0, 150));
  });
  
  await page.waitForTimeout(3000);
  
  const loginVis = await page.locator('#login-overlay').isVisible();
  console.log('Login visible:', loginVis);
  
  let appVisible = false;
  if (loginVis) {
    const optCount = await page.locator('#login-account option').count();
    console.log('Account options:', optCount);
    if (optCount > 0) {
      await page.selectOption('#login-account', 'admin');
      await page.fill('#login-password', '1234');
      await page.click('#login-btn');
      await page.waitForTimeout(2000);
      appVisible = await page.locator('#app-container').isVisible();
      console.log('App visible:', appVisible);
    }
  }
  
  if (appVisible) {
    const pages = ['dashboard', 'fees', 'staff', 'settings'];
    for (const pg of pages) {
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
          width: Math.round(rect.width),
          visible: rect.left < window.innerWidth && rect.right > 0,
          textPreview: s.textContent.trim().substring(0, 50).replace(/\n/g, ' ')
        };
      }, pg);
      console.log(JSON.stringify(r));
    }
    
    // Check new features
    const features = await page.evaluate(() => {
      return {
        searchInputs: document.querySelectorAll('input[type="search"], input[id$="search"]').length,
        exportButtons: document.querySelectorAll('button:contains("엑셀"), button:contains("내보내기")').length,
        helpTips: document.querySelectorAll('.help-tip, .faq-icon, .info-icon').length,
        sectionsInContent: document.getElementById('content')?.querySelectorAll(':scope > .page').length
      };
    });
    console.log('Features:', JSON.stringify(features));
  } else {
    console.log('Could not login');
  }
  
  console.log('DONE');
})();
