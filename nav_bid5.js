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
  
  // Check header checkbox
  const headerCheckbox = adPage.locator('table thead input[type="checkbox"]');
  if (await headerCheckbox.count() > 0) {
    await headerCheckbox.first().click();
    console.log('Checked select all');
    await adPage.waitForTimeout(500);
  }
  
  // Click the bid button
  const bidBtn = adPage.locator('button:has-text("입찰가 변경")');
  if (await bidBtn.count() > 0) {
    console.log('Button location...');
    const box = await bidBtn.first().boundingBox();
    console.log('Button box:', JSON.stringify(box));
    
    await bidBtn.first().click();
    await adPage.waitForTimeout(2000);
    
    // Get FULL page text to see what changed
    const text = await adPage.evaluate(() => document.body.innerText);
    console.log('=== FULL PAGE TEXT after click ===');
    console.log(text);
  }
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
