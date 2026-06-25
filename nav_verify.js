const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const pages = browser.contexts()[0].pages();
  const adPage = pages.find(p => p.url().includes('ads.naver.com'));
  if (!adPage) { console.log('Not found'); await browser.close(); return; }
  
  await adPage.bringToFront();
  await adPage.waitForTimeout(1000);
  
  await adPage.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566', { waitUntil: 'networkidle' });
  await adPage.waitForTimeout(3000);
  
  // Close any modal
  await adPage.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      if (btn.textContent.trim() === '닫기' && btn.offsetParent !== null) {
        btn.click();
      }
    }
  });
  await adPage.waitForTimeout(500);
  
  // Get keyword table data from page 1
  const page1Data = await adPage.evaluate(() => {
    const rows = document.querySelectorAll('table tbody tr');
    const results = [];
    
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length < 4) return;
      
      // Try to get keyword name
      let keyword = '';
      const firstCell = cells[0];
      if (firstCell) {
        // Sometimes the keyword is in a child element
        const kwEl = firstCell.querySelector('a, span, div');
        keyword = kwEl ? kwEl.textContent.trim() : firstCell.textContent.trim();
      }
      
      // Find bid value - look for "숫자원" pattern
      let bid = '';
      cells.forEach(cell => {
        const text = cell.textContent.trim();
        if (text.match(/^\d{1,3}(,\d{3})*원$/) && !text.includes('0원')) {
          bid = text;
        }
      });
      
      // Find status
      let status = '';
      cells.forEach(cell => {
        const text = cell.textContent.trim();
        if (text.includes('노출가능') || text.includes('중지') || text.includes('OFF')) {
          status = text;
        }
      });
      
      if (keyword && keyword.length > 0 && keyword.length < 30) {
        results.push({ keyword, bid, status: status.substring(0, 30) });
      }
    });
    
    return results;
  });
  
  console.log('=== PAGE 1 KEYWORDS ===');
  let activeCount = 0;
  let stoppedCount = 0;
  page1Data.forEach(k => {
    const isActive = k.status.includes('노출가능');
    const is1500 = k.bid.includes('1,500');
    if (isActive) activeCount++;
    if (k.status.includes('중지')) stoppedCount++;
    console.log(`  ${k.keyword}: ${k.bid} ${k.status} ${is1500 ? '✅' : '❌'}`);
  });
  console.log(`Active: ${activeCount}, Stopped: ${stoppedCount}`);
  console.log(`Total on page 1: ${page1Data.length}`);
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
