const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  let page = ctx.pages().find(x => x.url().includes('memorial_admin_logs'));
  if (!page) {
    page = await ctx.newPage();
    await page.goto('file:///C:/Users/paul/.openclaw/workspace/memorial_admin_logs.html');
  }
  
  await page.evaluate(() => {
    localStorage.setItem('chungsol_accounts', JSON.stringify([{ id: 'admin', name: '김민수', pw: '1234', type: 'master' }]));
    localStorage.setItem('chungsol_session', JSON.stringify({ id: 'admin', name: '김민수', type: 'master' }));
  });
  await page.reload();
  await page.waitForTimeout(2000);
  
  const tests = ['dashboard', 'fees', 'staff', 'settings', 'contracts'];
  const results = [];
  for (const pg of tests) {
    await page.evaluate(function(pg) {
      var btn = document.querySelector('.nav-item[data-page="' + pg + '"]');
      if (btn) btn.click();
    }, pg);
    await page.waitForTimeout(300);
    var r = await page.evaluate(function(pg) {
      var s = document.querySelector('.page[data-page="' + pg + '"]');
      if (!s) return { page: pg, error: 'no section' };
      var rect = s.getBoundingClientRect();
      return {
        page: pg,
        active: s.classList.contains('active'),
        width: Math.round(rect.width),
        left: Math.round(rect.left),
        visible: rect.left < window.innerWidth && rect.right > 0
      };
    }, pg);
    results.push(r);
  }
  results.forEach(r => console.log(JSON.stringify(r)));
  
  var allOK = results.every(r => r.visible && r.active);
  console.log(allOK ? '✅ ALL PAGES VISIBLE!' : '❌ SOME ISSUES');
  
  await page.screenshot({ path: 'logs_fixed_final.png', fullPage: true });
  console.log('Screenshot saved');
})();
