const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const pages = browser.contexts()[0].pages();
  const adPage = pages.find(p => p.url().includes('ads.naver.com'));
  if (!adPage) { console.log('Not found'); await browser.close(); return; }
  
  await adPage.bringToFront();
  await adPage.waitForTimeout(1000);
  
  await adPage.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566', { waitUntil: 'networkidle' });
  await adPage.waitForTimeout(3000);
  
  // Select all on page
  const headerCheckbox = adPage.locator('table thead input[type="checkbox"]');
  if (await headerCheckbox.count() > 0) {
    await headerCheckbox.first().click();
    await adPage.waitForTimeout(500);
  }
  
  // Click bid button
  const bidBtn = adPage.locator('button:has-text("입찰가 변경")');
  if (await bidBtn.count() > 0) {
    await bidBtn.first().click();
    await adPage.waitForTimeout(1000);
  }
  
  // Click batch change
  const batchLi = adPage.locator('li:has-text("입찰가 일괄 변경")');
  if (await batchLi.count() > 0) {
    await batchLi.first().click();
    await adPage.waitForTimeout(2000);
  }
  
  // Now interact with the modal
  // First, click on the text "원 으로 변경" - the first option label
  // Let me try clicking the first text input that says "원 으로 변경" area
  // Actually, since the first radio is already selected by default, I just need to fill the input
  
  // Find all inputs of type "number" in the modal
  const numberInputs = adPage.locator('input[type="number"]');
  const count = await numberInputs.count();
  console.log('Number inputs found:', count);
  
  if (count > 0) {
    // The first number input is "70" - the direct bid input
    const firstBidInput = numberInputs.first();
    await firstBidInput.click();
    await adPage.waitForTimeout(300);
    await firstBidInput.fill('');
    await adPage.waitForTimeout(300);
    await firstBidInput.fill('1500');
    console.log('Set bid to 1500');
    await adPage.waitForTimeout(500);
  }
  
  // Preview
  const previewBtn = adPage.locator('button:has-text("변경사항 미리보기")');
  console.log('Preview buttons:', await previewBtn.count());
  
  if (await previewBtn.count() > 0) {
    // The preview button is at y=796 - it's inside the modal
    await previewBtn.first().click();
    await adPage.waitForTimeout(2000);
    
    const text = await adPage.evaluate(() => document.body.innerText);
    const previewIdx = text.indexOf('변경사항 미리보기');
    if (previewIdx >= 0) {
      console.log('=== PREVIEW ===');
      console.log(text.substring(previewIdx, Math.min(previewIdx + 800, text.length)));
    }
    
    // Now apply - find "변경" button (not "변경사항 미리보기")
    const applyBtn = adPage.locator('button').filter({ hasNotText: '미리보기' }).filter({ hasText: '변경' });
    console.log('Apply buttons:', await applyBtn.count());
    
    if (await applyBtn.count() > 0) {
      await applyBtn.first().click();
      console.log('Clicked apply');
      await adPage.waitForTimeout(3000);
      
      const finalText = await adPage.evaluate(() => document.body.innerText);
      console.log('=== AFTER APPLY ===');
      console.log(finalText.substring(0, 2000));
    }
  }
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
