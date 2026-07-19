const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  const adsPage = pages.find(p => p.url().includes('ads.naver.com'));
  
  const baseUrl = 'https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566';
  await adsPage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 4000));
  
  let allKeywordText = '';
  
  for (let pg = 1; pg <= 12; pg++) {
    if (pg > 1) {
      const clicked = await adsPage.evaluate((p) => {
        const links = document.querySelectorAll('a');
        for (const link of links) {
          if (link.innerText.trim() === String(p) && link.offsetParent !== null) {
            link.click();
            return true;
          }
        }
        return false;
      }, pg);
      if (!clicked) break;
      await new Promise(r => setTimeout(r, 3000));
    }
    
    // Use DOM to extract table rows properly
    const kwData = await adsPage.evaluate(() => {
      // Find keyword name cells - they contain the keyword text
      const rows = [];
      const cells = document.querySelectorAll('td');
      let currentKw = null;
      
      // Try to find rows by looking at tr elements
      const trs = document.querySelectorAll('table tbody tr');
      
      trs.forEach(tr => {
        const tds = tr.querySelectorAll('td');
        if (tds.length < 8) return;
        
        // The keyword name is usually in the 2nd td
        const nameCell = tds[1];
        const name = nameCell ? nameCell.innerText.trim() : '';
        
        // Skip summary rows
        if (!name || name.includes('확장검색') || name.includes('전체') || name.includes('키워드') || name === '키워드') return;
        
        const statusCell = tds[0];
        const status = statusCell ? statusCell.innerText.trim() : '';
        
        // Extract other data from text content
        const rowText = tr.innerText.trim();
        
        rows.push({
          name,
          rawText: rowText.slice(0, 300)
        });
      });
      
      return rows;
    });
    
    console.log(`=== PAGE ${pg} === ${kwData.length} keywords`);
    kwData.forEach(k => console.log(`  ${k.name}`));
    
    allKeywordText += `\n=== PAGE ${pg} ===\n`;
    kwData.forEach(k => allKeywordText += `${k.name}\n`);
  }
  
  console.log('\n\n=== ALL KEYWORDS ===');
  console.log(allKeywordText);
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
