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
  const pageNums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  
  for (const pageNum of pageNums) {
    console.log(`\n=== PAGE ${pageNum} ===`);
    
    // Click page number link
    const clicked = await adsPage.evaluate((pg) => {
      const links = document.querySelectorAll('a');
      for (const link of links) {
        if (link.innerText.trim() === String(pg) && link.offsetParent !== null) {
          link.click();
          return true;
        }
      }
      return false;
    }, pageNum);
    
    if (!clicked && pageNum === 1) {
      // Page 1 is already shown, that's fine
    } else if (!clicked) {
      console.log(`  Can't click page ${pageNum}, skipping`);
      continue;
    }
    
    await new Promise(r => setTimeout(r, 3000));
    
    // Extract keywords from this page's table
    const pageData = await adsPage.evaluate(() => {
      const text = document.body.innerText;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      
      // Find keyword section
      let keywordList = [];
      let inTable = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Detect start of keyword data rows (after header)
        if (line.includes('키워드 118개 결과') || line === '키워드') {
          inTable = true;
          continue;
        }
        
        // Detect end of table
        if (inTable && (line.match(/^\d+\s*\/\s*페이지/) || line.includes('이용약관'))) {
          break;
        }
        
        if (!inTable) continue;
        
        // Skip header labels
        if (['ON/OFF', '키워드', '상태', '현재 입찰가(VAT미포함)', '광고 연관지수', 
             '클릭 기대지수', '노출수', '클릭수', '클릭률(%)', '노출현황보기', 
             '평균 CPC', '총비용'].includes(line)) continue;
        
        // Skip summary rows
        if (line.startsWith('전체') || line.startsWith('확장검색') || line.startsWith('키워드 ')) continue;
        if (line.startsWith('필터')) continue;
        
        keywordList.push(line);
      }
      
      return keywordList;
    });
    
    console.log(`  Raw lines: ${pageData.length}`);
    pageData.slice(0, 15).forEach(l => console.log(`  ${l}`));
    
    // Now parse keyword blocks from the lines
    // Keywords are followed by status, then bid, then numbers
    let kw = null;
    let block = [];
    
    for (const line of pageData) {
      // A keyword is typically Korean text, 2-15 chars
      if (/^[가-힣A-Za-z0-9]+[가-힣A-Za-z0-9\s#\-_]*$/.test(line) && 
          line.length > 1 && line.length < 25 &&
          !line.startsWith('1') && !line.startsWith('2') &&
          !line.startsWith('3') && !line.startsWith('4') &&
          !line.startsWith('5') && !line.startsWith('6') &&
          !line.startsWith('7') && !line.startsWith('8') &&
          !line.startsWith('9') && !line.startsWith('0') &&
          !line.endsWith('원') && !line.endsWith('%') &&
          !line.includes('노출') && !line.includes('클릭') &&
          !line.includes('중지') && !line.includes('운영') &&
          !line.includes('기본') && !line.includes('입찰') &&
          !line.includes('보기') && !line.includes('행') &&
          !line.includes('OFF')) 
      {
        // This is likely a keyword name
        if (kw) {
          // Save previous keyword
          block.push(kw);
        }
        kw = { name: line, status: '', bid: '', impressions: '0', clicks: '0', ctr: '', cpc: '', cost: '0' };
      } else if (kw) {
        // Categorize: status, bid, or metric
        if (line.includes('중지') || line.includes('노출가능') || line.includes('적은검색량')) {
          kw.status = line;
        } else if (line.includes('원') && !line.includes('%')) {
          kw.bid = line;
        } else if (line.includes('%')) {
          kw.ctr = line;
        } else if (/^\d+$/.test(line)) {
          if (kw.impressions === '0') kw.impressions = line;
          else if (kw.clicks === '0') kw.clicks = line;
        } else if (line === '보기') {
          // skip
        }
      }
    }
    if (kw) block.push(kw);
    
    console.log(`  Parsed keywords: ${block.length}`);
    allKeywords = allKeywords.concat(block);
    
    block.forEach(k => {
      if (k.clicks !== '0' || parseInt(k.impressions) > 0) {
        console.log(`  >> ${k.name} | 상태:${k.status.slice(0,15)} | 노출:${k.impressions} | 클릭:${k.clicks} | CTR:${k.ctr} | CPC:${k.cpc} | 비용:${k.cost}`);
      }
    });
    
    // If page 12, we're done
    if (pageNum === 12) break;
  }
  
  console.log(`\n\n=== TOTAL KEYWORDS COLLECTED: ${allKeywords.length} ===`);
  
  // Filter keywords with clicks
  const withClicks = allKeywords.filter(k => parseInt(k.clicks) > 0);
  const withImpressions = allKeywords.filter(k => parseInt(k.impressions) > 0);
  
  console.log(`\n=== KEYWORDS WITH CLICKS (${withClicks.length}) ===`);
  withClicks.forEach(k => console.log(`  ${k.name} | 노출:${k.impressions} | 클릭:${k.clicks} | CTR:${k.ctr} | 비용:${k.cost}`));
  
  console.log(`\n=== KEYWORDS WITH IMPRESSIONS (${withImpressions.length}) ===`);
  withImpressions.forEach(k => console.log(`  ${k.name} | 노출:${k.impressions} | 클릭:${k.clicks} | 상태:${k.status.slice(0,12)} | 입찰가:${k.bid}`));
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
