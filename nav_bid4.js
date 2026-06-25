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
  
  // First check the header checkbox (select all on page)
  const headerCheckbox = adPage.locator('table thead input[type="checkbox"]');
  console.log('Header checkbox count:', await headerCheckbox.count());
  
  if (await headerCheckbox.count() > 0) {
    await headerCheckbox.first().click();
    console.log('Checked select all');
    await adPage.waitForTimeout(1000);
  } else {
    // Try the first visible checkbox
    const allCheckboxes = adPage.locator('input[type="checkbox"]');
    const count = await allCheckboxes.count();
    console.log('Total checkboxes:', count);
    if (count > 0) {
      await allCheckboxes.first().click();
      console.log('Clicked first checkbox');
      await adPage.waitForTimeout(1000);
    }
  }
  
  // Now try clicking bid change button
  const bidBtn = adPage.locator('button:has-text("입찰가 변경")');
  if (await bidBtn.count() > 0) {
    // Wait a bit and check for any modal/dialog
    const dialogHandler = async (dialog) => {
      console.log('Dialog appeared:', dialog.message().substring(0, 200));
      await dialog.accept();
    };
    adPage.on('dialog', dialogHandler);
    
    await bidBtn.first().click();
    console.log('Clicked bid button');
    
    // Wait for navigation / modal
    await adPage.waitForTimeout(3000);
    
    // Take screenshot
    await adPage.screenshot({ path: 'C:\\Users\\paul\\.openclaw\\workspace\\nav_bid_state.png' });
    console.log('Screenshot saved');
    
    // Check current URL
    console.log('Current URL:', adPage.url());
    
    // Check for dialog/modal elements
    const modalText = await adPage.evaluate(() => {
      // Check for modal layers
      const modals = document.querySelectorAll('[role="dialog"], [role="alertdialog"], .modal, .ant-modal, [class*="modal"], [class*="dialog"]');
      const results = [];
      modals.forEach(m => {
        results.push({
          role: m.getAttribute('role'),
          class: m.className?.substring(0, 80),
          text: m.textContent?.substring(0, 300)?.trim()
        });
      });
      
      // Also check for overlay
      const overlays = document.querySelectorAll('[class*="overlay"], [class*="Overlay"]');
      overlays.forEach(o => {
        results.push({
          type: 'overlay',
          class: o.className?.substring(0, 80)
        });
      });
      
      return results;
    });
    
    console.log('Modal elements:', JSON.stringify(modalText, null, 2));
  }
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
