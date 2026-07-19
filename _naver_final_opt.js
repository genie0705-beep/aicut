const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  const adsPage = pages.find(p => p.url().includes('ads.naver.com'));
  
  const baseUrl = 'https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566';
  
  let currentPage = 1;
  
  async function goToPage(target) {
    while (currentPage < target) {
      const next = currentPage + 1;
      const clicked = await adsPage.evaluate((np) => {
        const links = document.querySelectorAll('a');
        for (const link of links) {
          if (link.innerText.trim() === String(np) && link.offsetParent !== null) {
            link.click(); return true;
          }
        }
        return false;
      }, next);
      if (!clicked) {
        console.log(`  ⚠️ Cannot click page ${next} from ${currentPage}`);
        return false;
      }
      await new Promise(r => setTimeout(r, 2500));
      currentPage = next;
      console.log(`  → Page ${currentPage}`);
    }
    return true;
  }
  
  async function turnOffKeywords(keywords) {
    for (const kw of keywords) {
      const found = await adsPage.evaluate((kwName) => {
        if (!document.body.innerText.includes(kwName)) return 'NOT_ON_THIS_PAGE';
        const rows = document.querySelectorAll('tr');
        for (const row of rows) {
          if (row.innerText.includes(kwName)) {
            const cb = row.querySelector('input[type="checkbox"]');
            if (cb) { cb.click(); cb.checked = true; return 'CLICKED'; }
          }
        }
        return 'CB_NOT_FOUND';
      }, kw);
      console.log(`    ${kw}: ${found}`);
      await new Promise(r => setTimeout(r, 400));
    }
    
    if (keywords.length > 0) {
      const offResult = await adsPage.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        for (const b of btns) {
          if (b.innerText.trim() === 'OFF' && b.offsetParent !== null) {
            b.click(); return 'OFF_CLICKED';
          }
        }
        return 'OFF_NOT_FOUND';
      });
      console.log(`    Bulk OFF: ${offResult}`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  
  // Start from page 1
  await adsPage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 4000));
  currentPage = 1;
  
  // Targets: {page: [keywords to turn OFF]}
  const targets = {
    2: ['동영상마케팅', '동영상편집'],
    4: ['병원영상제작'],
    8: ['영상편집외주'],
    10: ['유튜브운영대행', '유튜브채널운영대행'],
    11: ['인스타그램릴스', '인스타그램영상편집', '인스타릴스편집']
  };
  
  const sortedPages = Object.keys(targets).map(Number).sort((a, b) => a - b);
  
  for (const pg of sortedPages) {
    console.log(`\n=== Targeting page ${pg} ===`);
    const ok = await goToPage(pg);
    if (ok) {
      await turnOffKeywords(targets[pg]);
    } else {
      console.log(`  Skipping page ${pg}`);
    }
  }
  
  // Verify
  console.log('\n=== FINAL VERIFICATION ===');
  await adsPage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 3000));
  currentPage = 1;
  
  // Check page 2
  await goToPage(2);
  const v1 = await adsPage.evaluate(() => {
    const t = document.body.innerText;
    const r = {};
    ['동영상마케팅', '동영상편집', '병원영상제작'].forEach(kw => {
      const i = t.indexOf(kw);
      if (i >= 0) {
        const s = t.slice(i, i + 100);
        r[kw] = s.includes('중지') ? 'OFF ✅' : s.slice(0, 50);
      } else r[kw] = 'N/A';
    });
    return r;
  });
  console.log('Page 2:', JSON.stringify(v1));
  
  // Check page 10
  await goToPage(10);
  const v2 = await adsPage.evaluate(() => {
    const t = document.body.innerText;
    const r = {};
    ['유튜브운영대행', '유튜브채널운영대행', '인스타릴스편집', '영상편집외주'].forEach(kw => {
      const i = t.indexOf(kw);
      if (i >= 0) {
        const s = t.slice(i, i + 100);
        r[kw] = s.includes('중지') ? 'OFF ✅' : s.slice(0, 50);
      } else r[kw] = 'N/A';
    });
    return r;
  });
  console.log('Page 10:', JSON.stringify(v2));
  
  // Summary
  console.log('\n========== DONE ==========');
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
