const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  let p = ctx.pages().find(x => x.url().includes('memorial_admin_logs'));
  if (!p) { p = await ctx.newPage(); await p.goto('file:///C:/Users/paul/.openclaw/workspace/memorial_admin_logs.html'); }
  else { await p.reload(); }
  await p.waitForTimeout(2000);
  
  // Manual login
  const login = await p.locator('#login-overlay').isVisible();
  console.log('Login visible:', login);
  if (login) {
    const opts = await p.locator('#login-account option').count();
    console.log('Options:', opts);
    if (opts > 0) {
      await p.selectOption('#login-account', 'admin');
      await p.fill('#login-password', '1234');
      await p.click('#login-btn');
      await p.waitForTimeout(2000);
    } else {
      console.log('No options - injecting session directly');
      await p.evaluate(() => {
        localStorage.setItem('chungsol_accounts', JSON.stringify([{ id: 'admin', name: '김민수', pw: '1234', type: 'master' }]));
        localStorage.setItem('chungsol_session', JSON.stringify({ id: 'admin', name: '김민수', type: 'master' }));
        location.reload();
      });
      await p.waitForTimeout(3000);
    }
  }
  
  const appVis = await p.locator('#app-container').isVisible();
  console.log('App visible:', appVis);
  
  if (appVis) {
    const info = await p.evaluate(() => {
      const c = document.getElementById('content');
      const sections = c?.querySelectorAll(':scope > .page');
      const fees = document.querySelector('.page[data-page="fees"]');
      const feesRect = fees?.getBoundingClientRect();
      return {
        sectionsCount: sections?.length || 0,
        feesWidth: feesRect ? Math.round(feesRect.width) : 0,
        feesLeft: feesRect ? Math.round(feesRect.left) : 0,
      };
    });
    console.log('Content info:', JSON.stringify(info));
    
    for (const pg of ['dashboard', 'fees', 'staff', 'settings']) {
      await p.evaluate(function(pg) { 
        var btn = document.querySelector('.nav-item[data-page="' + pg + '"]'); 
        if (btn) btn.click(); 
      }, pg);
      await p.waitForTimeout(300);
      var r = await p.evaluate(function(pg) {
        var s = document.querySelector('.page[data-page="' + pg + '"]');
        if (!s) return { page: pg, error: 'no' };
        var r = s.getBoundingClientRect();
        return {
          page: pg,
          w: Math.round(r.width),
          l: Math.round(r.left),
          v: r.left < window.innerWidth
        };
      }, pg);
      console.log(pg + ':', JSON.stringify(r));
    }
  }
  console.log('DONE');
})();
