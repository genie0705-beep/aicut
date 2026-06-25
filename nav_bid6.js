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
    await adPage.waitForTimeout(500);
  }
  
  // Click the bid button
  const bidBtn = adPage.locator('button:has-text("입찰가 변경")');
  if (await bidBtn.count() > 0) {
    await bidBtn.first().click();
    await adPage.waitForTimeout(1000);
  }
  
  // Now look for "입찰가 일괄 변경" or "입찰가 개별 변경" 
  // These appear as separate buttons at the bottom
  const batchBtns = await adPage.evaluate(() => {
    const allEls = document.querySelectorAll('button, a, span, div, li');
    const results = [];
    allEls.forEach(el => {
      const text = el.textContent.trim();
      if (text.includes('입찰가 일괄') || text.includes('입찰가 개별') || text.includes('일괄 변경') || text.includes('개별 변경')) {
        results.push({
          tag: el.tagName,
          text: text.substring(0, 50),
          rect: {
            x: el.getBoundingClientRect().x,
            y: el.getBoundingClientRect().y,
            width: el.getBoundingClientRect().width,
            height: el.getBoundingClientRect().height
          },
          visible: el.offsetParent !== null
        });
      }
    });
    return results;
  });
  
  console.log('Batch/Individual bid buttons:', JSON.stringify(batchBtns, null, 2));
  
  // If we found "입찰가 일괄 변경", click it
  const batchBtn = adPage.locator('button:has-text("입찰가 일괄 변경"), a:has-text("입찰가 일괄 변경"), span:has-text("입찰가 일괄 변경")');
  if (await batchBtn.count() > 0) {
    console.log('Clicking batch change button');
    await batchBtn.first().click();
    await adPage.waitForTimeout(3000);
    
    const text = await adPage.evaluate(() => document.body.innerText);
    console.log('After batch click:');
    console.log(text.substring(0, 3000));
  }
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
