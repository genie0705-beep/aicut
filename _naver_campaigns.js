const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  const adsPage = pages.find(p => p.url().includes('ads.naver.com'));
  
  // Go to all campaigns
  await adsPage.goto('https://ads.naver.com/manage/ad-accounts/334739/all-campaigns', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 4000));
  
  console.log('URL:', adsPage.url());
  const text = await adsPage.evaluate(() => document.body.innerText);
  console.log('--- PAGE TEXT ---');
  console.log(text);
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
