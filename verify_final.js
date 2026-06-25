const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find(x => x.url().includes('memorial_admin_logs'));
  if (!page) return console.log('no page');
  
  const pages = ['dashboard','fees','staff','settings','contracts'];
  for (const pg of pages) {
    await page.evaluate((pg) => {
      const btn = document.querySelector('.nav-item[data-page="' + pg + '"]');
      if (btn) btn.click();
    }, pg);
    await page.waitForTimeout(300);
    const r = await page.evaluate((pg) => {
      const s = document.querySelector('.page[data-page="' + pg + '"]');
      if (!s) return { page: pg, error: 'no section' };
      const rect = s.getBoundingClientRect();
      const vw = window.innerWidth;
      return {
        page: pg,
        active: s.classList.contains('active'),
        left: Math.round(rect.left),
        width: Math.round(rect.width),
        visible: rect.left < vw && rect.right > 0,
        preview: s.textContent.substring(0, 30).replace(/\n/g, ' ')
      };
    }, pg);
    console.log(JSON.stringify(r));
  }
  console.log('DONE');
})();
