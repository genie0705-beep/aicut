const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  let page = ctx.pages().find(x => x.url().includes('memorial_admin_logs'));
  if (!page) {
    page = await ctx.newPage();
    await page.goto('file:///C:/Users/paul/.openclaw/workspace/memorial_admin_logs.html');
  }
  
  // Set localStorage before page loads for auto-login
  await page.evaluate(() => {
    localStorage.setItem('chungsol_accounts', JSON.stringify([
      { id: 'admin', name: '김민수', pw: '1234', type: 'master', zone: '전체', role: '관리자' }
    ]));
    localStorage.setItem('chungsol_session', JSON.stringify({
      id: 'admin', name: '김민수', type: 'master', loginTime: new Date().toISOString()
    }));
  });
  
  // Reload to apply session
  await page.reload();
  await page.waitForTimeout(2000);
  
  // Try to login if needed
  let appVis = await page.locator('#app-container').isVisible();
  console.log('App visible after reload:', appVis);
  
  if (!appVis) {
    // Manual login
    const ov = await page.locator('#login-overlay').isVisible();
    console.log('Login overlay:', ov);
    if (ov) {
      const opts = await page.locator('#login-account option').count();
      console.log('Options:', opts);
      if (opts > 0) {
        await page.selectOption('#login-account', 'admin');
        await page.fill('#login-password', '1234');
        await page.click('#login-btn');
        await page.waitForTimeout(2000);
        appVis = await page.locator('#app-container').isVisible();
        console.log('After manual login:', appVis);
      } else {
        console.log('No options - login broken');
      }
    }
  }
  
  if (appVis) {
    const r = await page.evaluate(() => {
      const c = document.getElementById('content');
      const sc = c?.querySelectorAll(':scope > .page').length || 0;
      const out = document.querySelector('#app-container > .page');
      return { sections: sc, outside: !!out };
    });
    console.log('Sections:', r.sections, 'Outside:', r.outside);
    
    for (const pg of ['dashboard', 'fees', 'staff']) {
      await page.evaluate(function(pg) {
        var btn = document.querySelector('.nav-item[data-page="' + pg + '"]');
        if (btn) btn.click();
      }, pg);
      await page.waitForTimeout(300);
      var info = await page.evaluate(function(pg) {
        var s = document.querySelector('.page[data-page="' + pg + '"]');
        if (!s) return { error: 'no' };
        var r = s.getBoundingClientRect();
        return {
          active: s.classList.contains('active'),
          w: Math.round(r.width),
          visible: r.left < window.innerWidth && r.right > 0
        };
      }, pg);
      console.log(pg + ':', JSON.stringify(info));
    }
  }
  console.log('DONE');
})();
