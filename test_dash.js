const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('aicut_marketing'));
  if (!page) return console.log('404');
  
  await page.waitForTimeout(1000);
  
  const r = await page.evaluate(() => {
    const items = document.querySelectorAll('.nav-item');
    let ok = 0;
    items.forEach(b => { b.click(); const s = document.querySelector('.page[data-page="' + b.dataset.page + '"]'); if(s && s.classList.contains('active')) ok++; });
    localStorage.setItem('___t', '1');
    const ls = localStorage.getItem('___t');
    localStorage.removeItem('___t');
    return {nav: items.length, ok: ok, ls: ls === '1', title: document.getElementById('page-title')?.textContent};
  });
  
  console.log(JSON.stringify(r, null, 2));
  if(r.ok === r.nav) console.log('ALL GOOD');
  else console.log('SOME ISSUES');
})();
