const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  const adsPage = pages.find(p => p.url().includes('ads.naver.com'));
  
  const baseUrl = 'https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566';
  
  // Function to navigate to a specific page sequentially
  async function goToPage(targetPage) {
    for (let p = 1; p < targetPage; p++) {
      const next = p + 1;
      const clicked = await adsPage.evaluate((np) => {
        const links = document.querySelectorAll('a');
        for (const link of links) {
          if (link.innerText.trim() === String(np) && link.offsetParent !== null) {
            link.click();
            return true;
          }
        }
        return false;
      }, next);
      if (!clicked) {
        console.log(`  Failed to navigate from page ${p} to ${next}`);
        return false;
      }
      await new Promise(r => setTimeout(r, 2500));
    }
    return true;
  }
  
  // Function to turn OFF keywords on current page
  async function turnOffKeywords(keywords) {
    for (const kw of keywords) {
      const found = await adsPage.evaluate((kwName) => {
        // Check if keyword exists on this page
        if (!document.body.innerText.includes(kwName)) return 'NOT_ON_THIS_PAGE';
        
        // Find checkbox in the row containing this keyword
        const rows = document.querySelectorAll('tr');
        for (const row of rows) {
          if (row.innerText.includes(kwName)) {
            const cb = row.querySelector('input[type="checkbox"]');
            if (cb) {
              cb.click();
              cb.checked = true;
              return 'CLICKED';
            }
          }
        }
        return 'CHECKBOX_NOT_FOUND_IN_ROW';
      }, kw);
      console.log(`    ${kw}: ${found}`);
      await new Promise(r => setTimeout(r, 500));
    }
    
    // Click OFF in the action bar
    if (keywords.length > 0) {
      // First, click on a visible element to ensure the action bar appears
      await adsPage.evaluate(() => {
        // The action bar should auto-appear when checkboxes are selected
        // Look for the OFF button
        const btns = Array.from(document.querySelectorAll('button'));
        for (const b of btns) {
          if (b.innerText.trim() === 'OFF' && b.offsetParent !== null) {
            b.click();
            return 'CLICKED_OFF';
          }
        }
        return 'OFF_NOT_FOUND';
      });
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  
  // Navigate to page 5 first
  await adsPage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 4000));
  
  // Pages 8, 10, 11 need sequential navigation
  // First go to page 8 via sequential clicks
  console.log('\n=== Navigating to page 8 ===');
  const to8 = await goToPage(8);
  if (to8) {
    console.log('  At page 8');
    // 영상편집외주 - 28imp/0clicks
    await turnOffKeywords(['영상편집외주']);
  }
  
  // Page 9 -> 10 -> 11
  console.log('\n=== Navigating to page 10 ===');
  const to10 = await goToPage(10);
  if (to10) {
    console.log('  At page 10');
    await turnOffKeywords(['유튜브운영대행', '유튜브채널운영대행']);
  }
  
  console.log('\n=== Navigating to page 11 ===');
  const to11 = await goToPage(11);
  if (to11) {
    console.log('  At page 11');
    await turnOffKeywords(['인스타그램릴스', '인스타그램영상편집', '인스타릴스편집']);
  }
  
  // Verify key changes on page 10
  console.log('\n=== VERIFICATION (page 10) ===');
  await adsPage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 3000));
  await goToPage(10);
  await new Promise(r => setTimeout(r, 2000));
  
  const verify = await adsPage.evaluate(() => {
    const text = document.body.innerText;
    const results = {};
    
    ['유튜브운영대행', '유튜브채널운영대행', '인스타그램릴스', '영상편집외주', '동영상마케팅', '동영상편집'].forEach(kw => {
      const idx = text.indexOf(kw);
      if (idx >= 0) {
        const snippet = text.slice(idx, idx + 80);
        // Check if it contains OFF
        results[kw] = snippet.includes('OFF') || snippet.includes('중지') ? 'OFF ✅' : snippet.slice(0, 40);
      } else {
        results[kw] = 'NOT ON THIS PAGE';
      }
    });
    
    return results;
  });
  
  console.log('Verification:', JSON.stringify(verify, null, 2));
  
  // Check page 2 for 동영상마케팅, 동영상편집
  console.log('\n=== Verification (page 2) ===');
  await adsPage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 3000));
  await goToPage(2);
  await new Promise(r => setTimeout(r, 2000));
  
  const verify2 = await adsPage.evaluate(() => {
    const text = document.body.innerText;
    const results = {};
    ['동영상마케팅', '동영상편집', '병원영상제작'].forEach(kw => {
      const idx = text.indexOf(kw);
      if (idx >= 0) {
        results[kw] = text.slice(idx, idx + 80).includes('OFF') || text.slice(idx, idx + 80).includes('중지') ? 'OFF ✅' : 'STILL ON ❌';
      } else {
        results[kw] = 'NOT ON THIS PAGE';
      }
    });
    return results;
  });
  
  console.log('Verification2:', JSON.stringify(verify2, null, 2));
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
