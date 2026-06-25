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
  
  async function closeModal() {
    // Check for modal overlay and close it
    const closeBtn = adPage.locator('button:has-text("닫기")');
    if (await closeBtn.count() > 0) {
      await closeBtn.first().click();
      await adPage.waitForTimeout(1000);
      return true;
    }
    return false;
  }
  
  async function applyBidChange() {
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
    
    // Fill 1500
    const numberInputs = adPage.locator('input[type="number"]');
    if (await numberInputs.count() > 0) {
      await numberInputs.first().fill('1500');
      await adPage.waitForTimeout(500);
    }
    
    // Preview
    const previewBtn = adPage.locator('button:has-text("변경사항 미리보기")');
    if (await previewBtn.count() > 0) {
      await previewBtn.first().click();
      await adPage.waitForTimeout(1500);
    }
    
    // Apply - use evaluate to bypass overlay
    const applied = await adPage.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        if (btn.textContent.trim() === '변경' && btn.offsetParent !== null) {
          // Check if button is inside a modal
          const modal = btn.closest('[class*="modal"]');
          if (modal) {
            btn.click();
            return true;
          }
        }
      }
      return false;
    });
    
    console.log(`Apply: ${applied}`);
    await adPage.waitForTimeout(2000);
    
    // Close any success modal
    await closeModal();
    await adPage.waitForTimeout(500);
  }
  
  // Process page 1 first (already done in previous run, but let's verify)
  // Actually let's start from page 2 since page 1 was already done
  
  for (let pageNum = 2; pageNum <= 10; pageNum++) {
    console.log(`\n=== Page ${pageNum} ===`);
    
    // Close any residual modal
    await closeModal();
    
    // Click page number - use evaluate to handle modal overlay
    const navigated = await adPage.evaluate((pageNum) => {
      // Find pagination buttons
      const allEls = document.querySelectorAll('button, a, span, li');
      for (const el of allEls) {
        if (el.textContent.trim() === String(pageNum) && el.offsetParent !== null) {
          el.click();
          return true;
        }
      }
      return false;
    }, pageNum);
    
    if (!navigated) {
      console.log(`Page ${pageNum} button not found, stopping`);
      break;
    }
    
    console.log(`Navigated to page ${pageNum}`);
    await adPage.waitForTimeout(2000);
    
    // Close any modal that appeared after navigation
    await closeModal();
    await adPage.waitForTimeout(500);
    
    // Apply bid change
    await applyBidChange();
  }
  
  // Close any modal
  await closeModal();
  
  // Go back to page 1
  const navigated = await adPage.evaluate(() => {
    const allEls = document.querySelectorAll('button, a, span, li');
    for (const el of allEls) {
      if (el.textContent.trim() === '1' && el.offsetParent !== null) {
        el.click();
        return true;
      }
    }
    return false;
  });
  
  await adPage.waitForTimeout(2000);
  await closeModal();
  
  const text = await adPage.evaluate(() => document.body.innerText);
  const lines = text.split('\n');
  const kwLines = lines.filter(l => l.includes('1,500'));
  console.log(`\n=== FINAL VERIFICATION ===`);
  console.log(`Keywords showing 1,500원: ${kwLines.length}`);
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
