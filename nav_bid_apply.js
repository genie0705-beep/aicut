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
  
  // Step 1: Check header checkbox to select all on page 1
  const headerCheckbox = adPage.locator('table thead input[type="checkbox"]');
  if (await headerCheckbox.count() > 0) {
    await headerCheckbox.first().click();
    console.log('Selected all on page 1');
    await adPage.waitForTimeout(500);
  }
  
  // Step 2: Click bid change button
  const bidBtn = adPage.locator('button:has-text("입찰가 변경")');
  if (await bidBtn.count() > 0) {
    await bidBtn.first().click();
    await adPage.waitForTimeout(1000);
  }
  
  // Step 3: Click "입찰가 일괄 변경" from the dropdown menu
  const batchLi = adPage.locator('li:has-text("입찰가 일괄 변경")');
  if (await batchLi.count() > 0) {
    await batchLi.first().click();
    console.log('Clicked batch change');
    await adPage.waitForTimeout(2000);
  }
  
  // Step 4: Select option "각 그룹의 기본 입찰가로 변경"
  // Find the radio/option and click it
  const groupBidOption = adPage.locator('text=각 그룹의 기본 입찰가로 변경');
  if (await groupBidOption.count() > 0) {
    await groupBidOption.first().click();
    console.log('Selected group default bid option');
    await adPage.waitForTimeout(500);
  }
  
  // Step 5: Click "변경사항 미리보기" or "변경"
  const previewBtn = adPage.locator('button:has-text("변경사항 미리보기")');
  if (await previewBtn.count() > 0) {
    await previewBtn.first().click();
    console.log('Clicked preview');
    await adPage.waitForTimeout(2000);
    
    // Check what preview shows
    const text = await adPage.evaluate(() => document.body.innerText);
    const previewSection = text.substring(text.indexOf('변경사항 미리보기'), text.indexOf('변경사항 미리보기') + 1000);
    console.log('Preview:', previewSection);
  }
  
  // Step 6: Click "변경" to apply
  const changeBtn = adPage.locator('button:has-text("변경"):not(:has-text("변경사항"))');
  console.log('Change button count:', await changeBtn.count());
  
  // Get all text to see the current state
  const finalText = await adPage.evaluate(() => document.body.innerText);
  console.log('=== FINAL STATE ===');
  console.log(finalText.substring(0, 4000));
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
