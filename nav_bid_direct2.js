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
  
  // Click batch change from dropdown
  const batchLi = adPage.locator('li:has-text("입찰가 일괄 변경")');
  if (await batchLi.count() > 0) {
    await batchLi.first().click();
    await adPage.waitForTimeout(2000);
  }
  
  // Instead of clicking the radio, click the label text "원 으로 변경" or the text for option 1
  // The first option text contains "원 으로 변경"
  const directOption = adPage.locator('text=원 으로 변경');
  console.log('Direct option elements found:', await directOption.count());
  
  if (await directOption.count() > 0) {
    await directOption.first().click();
    await adPage.waitForTimeout(500);
  }
  
  // Now fill the text input with "1500"
  const textInput = adPage.locator('input[type="text"]').first();
  if (await textInput.count() > 0) {
    await textInput.first().click();
    await textInput.first().fill('');
    await adPage.waitForTimeout(200);
    await textInput.first().fill('1500');
    console.log('Filled 1500');
    await adPage.waitForTimeout(500);
  }
  
  // Preview
  const previewBtn = adPage.locator('button:has-text("변경사항 미리보기")');
  if (await previewBtn.count() > 0) {
    await previewBtn.first().click();
    await adPage.waitForTimeout(2000);
    
    const text = await adPage.evaluate(() => document.body.innerText);
    const previewIdx = text.indexOf('변경사항 미리보기');
    if (previewIdx >= 0) {
      console.log('--- PREVIEW ---');
      console.log(text.substring(previewIdx, Math.min(previewIdx + 800, text.length)));
    }
    
    // Now click "변경" button to apply
    const changeBtn = adPage.locator('button:has-text("변경"):not(:has-text("변경사항"))').last();
    if (await changeBtn.count() > 0) {
      await changeBtn.click();
      console.log('Clicked apply change');
      await adPage.waitForTimeout(3000);
      
      const finalText = await adPage.evaluate(() => document.body.innerText);
      console.log('--- FINAL ---');
      // Check for success message
      if (finalText.includes('성공') || finalText.includes('완료') || finalText.includes('적용')) {
        console.log('Success!');
      }
      console.log(finalText.substring(0, 2000));
    }
  }
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
