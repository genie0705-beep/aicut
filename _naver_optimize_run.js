const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  const adsPage = pages.find(p => p.url().includes('ads.naver.com'));
  
  const baseUrl = 'https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566';
  
  // Define targets by keyword name and action
  const targets = {
    2: { off: ['동영상마케팅', '동영상편집'] },  // 362+55 imp, 0 clicks
    4: { off: ['병원영상제작'] },  // 28 imp, 0 clicks
    8: { off: ['영상편집외주'] },  // 28 imp, 0 clicks
    10: { off: ['유튜브운영대행', '유튜브채널운영대행'] },  // 170+209 imp, 0 clicks
    11: { off: ['인스타그램릴스', '인스타그램영상편집', '인스타릴스편집'] }  // 35+29+61 imp, 0 clicks
  };
  
  let totalOff = 0;
  
  for (const [pageNum, actions] of Object.entries(targets)) {
    const pg = parseInt(pageNum);
    console.log(`\n=== PAGE ${pg} ===`);
    
    // Navigate to page
    await adsPage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 4000));
    
    // Click page number
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
      if (!clicked) {
        console.log(`  Failed to navigate to page ${pg}`);
        continue;
      }
      await new Promise(r => setTimeout(r, 3000));
    }
    
    // Find and click checkboxes for target keywords
    for (const kwName of (actions.off || [])) {
      const found = await adsPage.evaluate((kw) => {
        // Find the row containing this keyword name
        const allText = document.body.innerText;
        const idx = allText.indexOf(kw);
        if (idx < 0) return 'NOT_FOUND';
        
        // Find the checkbox in this row
        // Checkboxes follow keyword rows in the table
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        const rows = document.querySelectorAll('tr');
        
        for (const row of rows) {
          if (row.innerText.includes(kw)) {
            const cb = row.querySelector('input[type="checkbox"]');
            if (cb) {
              cb.click();
              cb.checked = true;
              return 'CLICKED';
            }
          }
        }
        
        // Fallback: try to find by text position
        const textNodes = document.createTreeWalker(document.body, 4, null, false);
        let node;
        let checkIdx = 0;
        while (node = textNodes.nextNode()) {
          if (node.textContent.includes(kw)) {
            // Find nearest checkbox
            let el = node.parentElement;
            while (el && el !== document.body) {
              const cb = el.querySelector('input[type="checkbox"]');
              if (cb) { cb.click(); cb.checked = true; return 'CLICKED_BY_TRAVERSAL'; }
              el = el.parentElement;
            }
          }
        }
        
        return 'CHECKBOX_NOT_FOUND';
      }, kwName);
      
      console.log(`  ${kwName}: ${found}`);
      await new Promise(r => setTimeout(r, 500));
    }
    
    // Click OFF in the floating action bar
    if ((actions.off || []).length > 0) {
      // First ensure we click outside to trigger the action bar
      await adsPage.evaluate(() => {
        // Click on the table to ensure focus
        const table = document.querySelector('table');
        if (table) table.click();
      });
      await new Promise(r => setTimeout(r, 500));
      
      // Click "OFF" button in the action bar
      const offResult = await adsPage.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        for (const b of btns) {
          if (b.innerText.trim() === 'OFF' && b.offsetParent !== null) {
            b.click();
            return 'CLICKED_OFF';
          }
        }
        return 'OFF_BTN_NOT_FOUND';
      });
      
      console.log(`  Bulk OFF action: ${offResult}`);
      await new Promise(r => setTimeout(r, 2000));
    }
    
    totalOff += (actions.off || []).length;
  }
  
  console.log(`\n=== TOTAL: ${totalOff} keywords set to OFF ===`);
  
  // Verify the changes by checking the status of key targets
  console.log('\n=== VERIFICATION ===');
  
  // Check page 10 to verify 유튜브운영대행 and 유튜브채널운영대행
  await adsPage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 3000));
  
  await adsPage.evaluate(() => {
    const links = document.querySelectorAll('a');
    for (const link of links) {
      if (link.innerText.trim() === '10' && link.offsetParent !== null) {
        link.click(); return;
      }
    }
  });
  await new Promise(r => setTimeout(r, 3000));
  
  const verify = await adsPage.evaluate(() => {
    const text = document.body.innerText;
    const results = {};
    
    // Check 유튜브운영대행
    const ytIdx = text.indexOf('유튜브운영대행');
    if (ytIdx >= 0) results['유튜브운영대행'] = text.slice(ytIdx, ytIdx + 100);
    
    const ytChanIdx = text.indexOf('유튜브채널운영대행');
    if (ytChanIdx >= 0) results['유튜브채널운영대행'] = text.slice(ytChanIdx, ytChanIdx + 100);
    
    return results;
  });
  
  console.log('Page 10 verification:', JSON.stringify(verify, null, 2));
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
