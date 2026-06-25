const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const pages = browser.contexts()[0].pages();
  const adPage = pages.find(p => p.url().includes('ads.naver.com'));
  if (!adPage) { console.log('Not found'); await browser.close(); return; }
  
  await adPage.bringToFront();
  await adPage.waitForTimeout(1000);
  
  // Navigate to the ad group
  await adPage.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566', { waitUntil: 'networkidle' });
  await adPage.waitForTimeout(3000);
  
  // Click the "입찰가 변경" button directly
  const bidBtn = adPage.locator('button:has-text("입찰가 변경")');
  console.log('Bid button count:', await bidBtn.count());
  
  if (await bidBtn.count() > 0) {
    await bidBtn.first().click();
    await adPage.waitForTimeout(3000);
    
    // Get page content after clicking
    const text = await adPage.evaluate(() => document.body.innerText);
    console.log('After bid button click:');
    console.log(text.substring(0, 3000));
  }
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
