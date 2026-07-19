const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  const adsPage = pages.find(p => p.url().includes('ads.naver.com'));
  
  const baseUrl = 'https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566';
  
  // First attempt: click "다운로드" to download all keywords as CSV
  await adsPage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 4000));
  
  // Find download button and check if there's a simpler way to get all data
  const downloadBtnText = await adsPage.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, a'));
    const downloadBtns = btns.filter(b => b.innerText.trim() === '다운로드');
    if (downloadBtns.length > 0) {
      // Click the last download button (the one in keyword section)
      downloadBtns[downloadBtns.length - 1].click();
      return 'CLICKED';
    }
    return 'NOT FOUND';
  });
  
  console.log('Download button:', downloadBtnText);
  await new Promise(r => setTimeout(r, 2000));
  
  // Get ALL page text - full body
  const fullText = await adsPage.evaluate(() => document.body.innerText);
  
  // Extract keyword section
  const kwIdx = fullText.indexOf('키워드 118개 결과');
  const keywordSection = kwIdx >= 0 ? fullText.slice(kwIdx) : 'NOT FOUND';
  
  console.log('=== FULL KEYWORD SECTION ===');
  console.log(keywordSection);
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
