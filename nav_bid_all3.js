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
  
  async function clickByText(text) {
    return await adPage.evaluate((btnText) => {
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        if (btn.textContent.trim() === btnText && btn.offsetParent !== null) {
          btn.click();
          return true;
        }
      }
      return false;
    }, text);
  }
  
  async function closeAllModals() {
    let closed = false;
    // Try clicking 닫기 buttons
    const result = await adPage.evaluate(() => {
      let count = 0;
      // Find 닫기 buttons
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        if (btn.textContent.trim() === '닫기' && btn.offsetParent !== null) {
          btn.click();
          count++;
        }
      }
      // Also try X close buttons (they often have specific icons)
      const closeEls = document.querySelectorAll('[class*="close"], [class*="Close"], [class*="modal-close"]');
      for (const el of closeEls) {
        if (el.offsetParent !== null) {
          el.click();
          count++;
        }
      }
      return count;
    });
    if (result > 0) {
      console.log(` Closed ${result} modal(s)`);
      await adPage.waitForTimeout(800);
      return true;
    }
    return false;
  }
  
  async function clickPagination(num) {
    return await adPage.evaluate((pageNum) => {
      const allEls = document.querySelectorAll('a, button, span, li');
      for (const el of allEls) {
        if (el.textContent.trim() === String(pageNum) && el.offsetParent !== null) {
          el.click();
          return true;
        }
      }
      return false;
    }, num);
  }
  
  async function applyBidChange() {
    // Check header checkbox (select all on page)
    await adPage.evaluate(() => {
      const checkboxes = document.querySelectorAll('table thead input[type="checkbox"]');
      if (checkboxes.length > 0) checkboxes[0].click();
    });
    await adPage.waitForTimeout(500);
    
    // Click "입찰가 변경" button
    await clickByText('입찰가 변경');
    await adPage.waitForTimeout(1000);
    
    // Click "입찰가 일괄 변경" from dropdown menu
    await adPage.evaluate(() => {
      const items = document.querySelectorAll('li');
      for (const item of items) {
        if (item.textContent.trim().includes('입찰가 일괄 변경') && item.offsetParent !== null) {
          item.click();
          return;
        }
      }
    });
    await adPage.waitForTimeout(2000);
    
    // Fill bid = 1500 - find the number input in the modal
    await adPage.evaluate(() => {
      const inputs = document.querySelectorAll('input[type="number"]');
      if (inputs.length > 0) {
        const input = inputs[0];
        // Use native input setter
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeInputValueSetter.call(input, '1500');
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await adPage.waitForTimeout(500);
    
    // Preview
    await clickByText('변경사항 미리보기');
    await adPage.waitForTimeout(1500);
    
    // Apply (click "변경" button inside modal)
    const applied = await adPage.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        if (btn.textContent.trim() === '변경' && btn.offsetParent !== null) {
          btn.click();
          return true;
        }
      }
      return false;
    });
    console.log(`  Apply result: ${applied}`);
    await adPage.waitForTimeout(2000);
    
    // Close any success modals
    await closeAllModals();
    await adPage.waitForTimeout(500);
  }
  
  // Page 1 already done, start from page 2
  for (let pageNum = 2; pageNum <= 10; pageNum++) {
    console.log(`\n--- Page ${pageNum} ---`);
    
    // Ensure no modal is blocking
    await closeAllModals();
    
    // Navigate to page
    const navResult = await clickPagination(pageNum);
    if (!navResult) {
      console.log(`  Page ${pageNum} not found, stopping`);
      break;
    }
    console.log(`  Navigated`);
    await adPage.waitForTimeout(2000);
    
    // Clear any residual modal
    await closeAllModals();
    
    // Apply bid change
    await applyBidChange();
  }
  
  // Clean up and verify
  await closeAllModals();
  
  // Go to page 1 to verify
  await clickPagination(1);
  await adPage.waitForTimeout(2000);
  await closeAllModals();
  
  // Get page content
  const text = await adPage.evaluate(() => document.body.innerText);
  
  // Extract keyword lines with bids
  const lines = text.split('\n');
  let keywordCount = 0;
  let bid1500Count = 0;
  
  for (let i = 0; i < lines.length; i++) {
    // Find keyword entries (look for patterns)
    if (lines[i].trim().endsWith('원') && lines[i].trim().match(/^\d{1,3}(,\d{3})*원$/)) {
      const bid = lines[i].trim();
      const keywordLine = lines[i-1]?.trim();
      if (bid === '1,500원') {
        bid1500Count++;
        console.log(`  ${keywordLine || '(keyword)'}: ${bid}`);
      } else {
        console.log(`  ${keywordLine || '(keyword)'}: ${bid} [NOT 1500]`);
      }
      keywordCount++;
    }
  }
  
  console.log(`\n=== FINAL ===`);
  console.log(`Total keyword bids found: ${keywordCount}`);
  console.log(`Keywords set to 1,500원: ${bid1500Count}`);
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
