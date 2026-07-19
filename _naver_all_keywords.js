const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  const adsPage = pages.find(p => p.url().includes('ads.naver.com'));
  
  const url = 'https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566';
  await adsPage.goto(url, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 4000));
  
  // Get ALL keywords across all pages
  const allData = await adsPage.evaluate(() => {
    const rows = document.querySelectorAll('table tbody tr');
    const keywords = [];
    
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 9) {
        const nameEl = cells[1]?.querySelector('a, span');
        const name = nameEl?.innerText?.trim();
        
        if (name && name.length > 0 && !name.includes('확장검색') && !name.includes('전체') && !name.includes('키워드')) {
          keywords.push({
            name: name,
            status: cells[0]?.innerText?.trim() || '',
            bid: cells[2]?.innerText?.trim() || '',
            impressions: cells[5]?.innerText?.trim() || '0',
            clicks: cells[6]?.innerText?.trim() || '0',
            ctr: cells[7]?.innerText?.trim() || '',
            avgCpc: cells[9]?.innerText?.trim() || '',
            cost: cells[10]?.innerText?.trim() || '0'
          });
        }
      }
    });
    
    return keywords;
  });
  
  console.log(`Total keywords found on page 1: ${allData.length}`);
  console.log('');
  
  // Filter for keywords with clicks or impressions
  const withData = allData.filter(k => parseInt(k.impressions) > 0 || parseInt(k.clicks) > 0);
  const withClicks = allData.filter(k => parseInt(k.clicks) > 0);
  
  console.log('=== KEYWORDS WITH IMPRESSIONS OR CLICKS ===');
  withData.forEach(k => console.log(
    `${k.name.padEnd(30)} | ${k.status.padEnd(15)} | 노출:${k.impressions.padStart(5)} | 클릭:${k.clicks.padStart(3)} | CTR:${(k.ctr || '-').padStart(6)} | CPC:${(k.avgCpc || '-').padStart(8)} | 비용:${(k.cost || '0').padStart(8)}`
  ));
  
  console.log('\n=== KEYWORDS WITH AT LEAST 1 CLICK ===');
  withClicks.forEach(k => console.log(
    `${k.name.padEnd(30)} | 노출:${k.impressions.padStart(5)} | 클릭:${k.clicks.padStart(3)} | CTR:${(k.ctr || '-').padStart(6)} | CPC:${(k.avgCpc || '-').padStart(8)} | 비용:${(k.cost || '0').padStart(8)}`
  ));
  
  console.log(`\nTotal keywords on page: ${allData.length}`);
  console.log(`Keywords with data: ${withData.length}`);
  console.log(`Keywords with clicks: ${withClicks.length}`);
  
  // Try pagination - check if there's a page 2 button
  const pageBtns = await adsPage.evaluate(() => {
    const btns = document.querySelectorAll('[class*="page"], button:has(svg), nav button');
    return Array.from(btns).slice(0, 20).map(b => b.innerText.trim().slice(0,10));
  });
  console.log('\nPagination buttons:', pageBtns);
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
