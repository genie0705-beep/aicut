const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  const adsPage = pages.find(p => p.url().includes('ads.naver.com'));
  
  const baseUrl = 'https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566';
  await adsPage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 4000));
  
  let allKeywords = [];
  let currentPage = 1;
  const maxPages = 12;
  
  while (currentPage <= maxPages) {
    // Extract keywords from the current page
    const pageKeywords = await adsPage.evaluate(() => {
      const text = document.body.innerText;
      const lines = text.split('\n');
      const keywords = [];
      let inKeywordSection = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Find keyword rows: they start with a keyword name
        // Pattern: keyword name line, then status line, etc.
        if (line === 'ON/OFF') {
          inKeywordSection = true;
          continue;
        }
        if (line.startsWith('1') && line.includes('/ 페이지')) {
          inKeywordSection = false;
          continue;
        }
        if (!inKeywordSection) continue;
        
        // Skip header/footer lines
        if (line === '키워드' || line === '상태' || line === 'ON/OFF' || 
            line === '현재 입찰가(VAT미포함)' || line === '노출수' || line === '클릭수' ||
            line === '클릭률(%)' || line === '평균 CPC' || line === '총비용' ||
            line.startsWith('전체 결과') || line.startsWith('확장검색 결과') ||
            line.startsWith('키워드 ') || line.startsWith('필터를') ||
            line === '' || line.includes('파워링크 반응형')) {
          continue;
        }
        
        // A keyword row typically starts with a Korean word
        if (/^[가-힣A-Z]/.test(line) && line.length > 1 && line.length < 30) {
          // Check if next few lines contain status, bid, etc.
          const keywordName = line;
          let status = '', bid = '', impressions = '0', clicks = '0', ctr = '', avgCpc = '', cost = '0';
          
          // Look ahead for the keyword data
          for (let j = i+1; j < Math.min(i+15, lines.length); j++) {
            const nextLine = lines[j].trim();
            if (nextLine.includes('중지') || nextLine.includes('노출가능') || 
                nextLine.includes('적은검색량') || nextLine.includes('운영')) {
              status = nextLine;
            } else if (nextLine.includes('원') && !nextLine.includes('노출') && !nextLine.includes('클릭')) {
              bid = nextLine;
            } else if (/^\d+$/.test(nextLine.replace(/,/g, '')) && impression === '0') {
              // First number = impressions
            }
          }
          
          // Try to extract from the visible text structure
          keywords.push(keywordName);
        }
      }
      
      return keywords;
    });
    
    // Different approach: get raw table HTML and parse
    const rawData = await adsPage.evaluate(() => {
      const text = document.body.innerText;
      // Find keyword section start
      const startMarker = '키워드 118개 결과';
      const start = text.indexOf(startMarker);
      if (start < 0) return 'NOT FOUND';
      
      const section = text.slice(start);
      // Find end (pagination)
      const endMatch = section.match(/\d+\s*\/\s*페이지/);
      const end = endMatch ? endMatch.index + endMatch[0].length : section.length;
      
      return section.slice(0, Math.min(end + 200, 10000));
    });
    
    console.log(`\n=== PAGE ${currentPage} KEYWORD SECTION ===`);
    console.log(rawData);
    
    // Check if there's a next page button
    const hasNext = await adsPage.evaluate(() => {
      // Look for pagination 'next' button that's not disabled
      const buttons = document.querySelectorAll('button, a');
      for (const btn of buttons) {
        const text = btn.innerText.trim();
        // Page numbers 1-12, find current active page
      }
      return false;
    });
    
    currentPage++;
    break; // For now, analyze what we have
  }
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
