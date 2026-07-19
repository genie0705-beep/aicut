const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  const adsPage = pages.find(p => p.url().includes('ads.naver.com'));
  
  const url = 'https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566';
  await adsPage.goto(url, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 4000));
  
  // Scroll the keyword table into view and get text
  const keywordSectionText = await adsPage.evaluate(() => {
    // Get all visible text in the keyword area
    const body = document.body.innerText;
    const idx = body.indexOf('새 키워드');
    if (idx >= 0) {
      return body.slice(idx, idx + 5000);
    }
    return body.slice(3000, 8000);
  });
  
  console.log(keywordSectionText);
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
