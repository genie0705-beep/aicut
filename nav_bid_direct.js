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
  
  // Step 1: Select header checkbox
  const headerCheckbox = adPage.locator('table thead input[type="checkbox"]');
  if (await headerCheckbox.count() > 0) {
    await headerCheckbox.first().click();
    await adPage.waitForTimeout(500);
  }
  
  // Step 2: Click "입찰가 변경" button
  const bidBtn = adPage.locator('button:has-text("입찰가 변경")');
  if (await bidBtn.count() > 0) {
    await bidBtn.first().click();
    await adPage.waitForTimeout(1000);
  }
  
  // Step 3: Click "입찰가 일괄 변경" from dropdown
  const batchLi = adPage.locator('li:has-text("입찰가 일괄 변경")');
  if (await batchLi.count() > 0) {
    await batchLi.first().click();
    await adPage.waitForTimeout(2000);
  }
  
  // Step 4: Click the first option (direct input radio) and clear/type 1500
  // Find the radio/input for direct bid
  const radioInput = adPage.locator('input[type="text"]').first();
  console.log('Text inputs found:', await adPage.locator('input[type="text"]').count());
  
  // Click the first radio option
  const firstRadio = adPage.locator('input[type="radio"]').first();
  console.log('Radio buttons found:', await adPage.locator('input[type="radio"]').count());
  
  if (await firstRadio.count() > 0) {
    await firstRadio.click();
    await adPage.waitForTimeout(500);
    
    // Now find the text input field and type 1500
    if (await radioInput.count() > 0) {
      await radioInput.first().click();
      await radioInput.first().fill('1500');
      console.log('Entered 1500');
      await adPage.waitForTimeout(500);
    }
  }
  
  // Step 5: Click "변경사항 미리보기"
  const previewBtn = adPage.locator('button:has-text("변경사항 미리보기")');
  if (await previewBtn.count() > 0) {
    await previewBtn.first().click();
    await adPage.waitForTimeout(2000);
    
    const text = await adPage.evaluate(() => document.body.innerText);
    console.log('Preview text:');
    // Find preview section
    const previewIdx = text.indexOf('변경사항 미리보기');
    if (previewIdx >= 0) {
      console.log(text.substring(previewIdx, previewIdx + 800));
    }
  }
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
