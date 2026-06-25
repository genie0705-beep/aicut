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
  
  // Select all
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
  
  // Fill bid to 1500
  const numberInputs = adPage.locator('input[type="number"]');
  const count = await numberInputs.count();
  console.log('Number inputs:', count);
  
  if (count > 0) {
    await numberInputs.first().click();
    await adPage.waitForTimeout(200);
    await numberInputs.first().fill('1500');
    console.log('Set to 1500');
    await adPage.waitForTimeout(500);
  }
  
  // Preview
  const previewBtn = adPage.locator('button:has-text("변경사항 미리보기")');
  if (await previewBtn.count() > 0) {
    await previewBtn.first().click();
    await adPage.waitForTimeout(2000);
    console.log('Preview shown');
  }
  
  // Find the "변경" button and use evaluate to click it
  const applyClicked = await adPage.evaluate(() => {
    // Find all buttons with text "변경"
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      if (btn.textContent.trim() === '변경' && btn.offsetParent !== null) {
        btn.click();
        return 'Clicked: ' + btn.textContent.trim();
      }
    }
    return 'Button not found';
  });
  
  console.log('Apply result:', applyClicked);
  await adPage.waitForTimeout(3000);
  
  // Check result
  const text = await adPage.evaluate(() => document.body.innerText);
  console.log('=== AFTER CLICK ===');
  if (text.includes('성공') || text.includes('완료') || text.includes('적용') || text.includes('처리')) {
    // Find success message
    const successIdx = text.indexOf('성공') >= 0 ? text.indexOf('성공') : 
                       text.indexOf('완료') >= 0 ? text.indexOf('완료') : 
                       text.indexOf('적용');
    if (successIdx >= 0) {
      console.log(text.substring(Math.max(0, successIdx - 100), successIdx + 300));
    }
  }
  console.log(text.substring(0, 1500));
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
