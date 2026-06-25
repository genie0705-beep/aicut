const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find(x => x.url().includes('memorial_admin_logs'));
  if (!page) return console.log('no page');
  await page.waitForTimeout(1000);
  
  // Login
  if (await page.locator('#login-overlay').isVisible()) {
    await page.selectOption('#login-account', 'admin');
    await page.fill('#login-password', '1234');
    await page.click('#login-btn');
    await page.waitForTimeout(1000);
  }
  
  // Analyze customer experience for each page
  const pages = ['dashboard','locations','contracts','fees','sales','staff','customers','notifications','logs','settings'];
  const results = [];
  
  for (const pg of pages) {
    await page.evaluate((pg) => {
      const btn = document.querySelector('.nav-item[data-page="' + pg + '"]');
      if (btn) btn.click();
    }, pg);
    await page.waitForTimeout(400);
    
    const r = await page.evaluate((pg) => {
      const s = document.querySelector('.page[data-page="' + pg + '"]');
      if (!s) return { page: pg, error: 'no section' };
      
      // UX analysis
      const text = s.textContent;
      const readTime = Math.round(text.length / 300); // 초당 300자 읽기 기준
      const buttons = s.querySelectorAll('button').length;
      const links = s.querySelectorAll('[data-goto], .link-btn').length;
      const inputs = s.querySelectorAll('input[type="text"], input[type="search"], select').length;
      const dataTables = s.querySelectorAll('table').length;
      const dataRows = s.querySelectorAll('table tbody tr').length;
      const hasSearch = text.includes('검색');
      const hasFilter = text.includes('전체') && (text.includes('필터') || s.querySelectorAll('.tab-btn').length > 0);
      const hasHelp = text.includes('도움') || text.includes('안내') || s.querySelectorAll('.section-sub').length > 0;
      const hasExport = text.includes('내보내기') || text.includes('엑셀') || text.includes('CSV');
      const hasPrint = text.includes('인쇄') || text.includes('출력');
      const isSampleData = text.includes('예:') || text.includes('예시');
      
      return {
        page: pg,
        buttons,
        links,
        formInputs: inputs,
        dataTables,
        dataRows,
        hasSearch,
        hasFilter,
        hasHelp,
        hasExport,
        hasPrint,
        isSampleData,
        readTimeSec: readTime
      };
    }, pg);
    results.push(r);
  }
  
  console.log(JSON.stringify(results, null, 2));
})();
