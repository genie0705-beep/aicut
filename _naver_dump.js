const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  const adsPage = pages.find(p => p.url().includes('ads.naver.com'));
  
  const baseUrl = 'https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566';
  await adsPage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 4000));
  
  const allText = {};
  
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
    
    // Extract text between '키워드 118개 결과' and the pagination
    const sectionText = await adsPage.evaluate(() => {
      const text = document.body.innerText;
      const start = text.indexOf('키워드 118개 결과');
      const end = text.indexOf('10 / 페이지');
      if (start >= 0 && end > start) {
        return text.slice(start, end + 20);
      }
      return '';
    });
    
    allText[pg] = sectionText;
    console.log(`=== PAGE ${pg} (${sectionText.length} chars) ===`);
  }
  
  // Parse all keywords across all pages
  for (let pg = 1; pg <= 12; pg++) {
    if (!allText[pg]) continue;
    
    const text = allText[pg];
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    
    console.log(`\n--- Page ${pg} full text ---`);
    console.log(text);
  }
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
