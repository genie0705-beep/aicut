const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const pages = browser.contexts()[0].pages();
  const adPage = pages.find(p => p.url().includes('ads.naver.com'));
  if (!adPage) { console.log('Not found'); await browser.close(); return; }
  
  await adPage.bringToFront();
  await adPage.waitForTimeout(1000);
  
  // Navigate directly to the ad group
  await adPage.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566', { waitUntil: 'networkidle' });
  await adPage.waitForTimeout(3000);
  
  // Get all keyword data from the table
  // First check if pagination exists and get all keywords
  const keywordData = await adPage.evaluate(() => {
    // Try to get all rows from the keyword table
    const rows = document.querySelectorAll('table tbody tr');
    const results = [];
    
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length < 5) return;
      
      // Get the keyword name (usually has a link or span)
      const keywordEl = row.querySelector('td a, td span');
      const keyword = keywordEl ? keywordEl.textContent.trim() : '';
      
      // Get status
      const statusCells = row.querySelectorAll('td');
      let status = '';
      let bid = '';
      
      for (const cell of statusCells) {
        const text = cell.textContent.trim();
        if (text.includes('노출가능') || text.includes('중지') || text.includes('OFF') || text.includes('적은검색량')) {
          status = text.substring(0, 50);
        }
        if (text.includes('원') && !text.includes('0원') && text.length < 15) {
          bid = text;
        }
      }
      
      if (keyword) {
        results.push({ keyword, status, bid });
      }
    });
    
    return results;
  });
  
  console.log('Keywords found in current view:', keywordData.length);
  console.log(JSON.stringify(keywordData, null, 2));
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
