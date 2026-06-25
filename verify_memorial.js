const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  let p = ctx.pages().find(x => x.url().includes('memorial_admin') && !x.url().includes('_logs'));
  if (!p) { console.log('no page'); return; }
  
  await p.evaluate(() => {
    localStorage.setItem('chungsol_accounts', JSON.stringify([{ id: 'admin', name: '김민수', pw: '1234', type: 'master', zone: '전체', role: '관리자' }]));
    localStorage.setItem('chungsol_session', JSON.stringify({ id: 'admin', name: '김민수', type: 'master', loginTime: new Date().toISOString() }));
  });
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForTimeout(2000);
  
  const appVis = await p.locator('#app-container').isVisible();
  console.log('App:', appVis);
  
  if (appVis) {
    const f = await p.evaluate(() => {
      const html = document.body.innerHTML;
      return {
        sections: document.querySelectorAll('.page').length,
        searchInputs: document.querySelectorAll('input[type="search"], input[id*="search"], input[placeholder*="검색"]').length,
        hasExport: html.includes('엑셀') || html.includes('CSV'),
        hasTodaySummary: html.includes('오늘의 요약'),
        hasCeoView: html.includes('대표님'),
        hasHelpTips: html.includes('help-tip'),
        hasChangeIndicator: html.includes('change-indicator'),
        hasEmptyMsg: html.includes('아직 데이터가 없습니다') || html.includes('empty-message')
      };
    });
    console.log(JSON.stringify(f, null, 2));
    
    // Test page navigation
    for (const pg of ['dashboard', 'fees', 'contracts', 'customers', 'logs']) {
      await p.evaluate((pg) => {
        const btn = document.querySelector('.nav-item[data-page="' + pg + '"]');
        if (btn) btn.click();
      }, pg);
      await p.waitForTimeout(300);
      const r = await p.evaluate((pg) => {
        const s = document.querySelector('.page[data-page="' + pg + '"]');
        if (!s) return { page: pg, error: 'no' };
        const rect = s.getBoundingClientRect();
        return { page: pg, w: Math.round(rect.width), visible: rect.left < window.innerWidth && rect.right > 0 };
      }, pg);
      console.log(pg + ':', JSON.stringify(r));
    }
  }
  console.log('DONE');
})();
