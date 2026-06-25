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
  
  // Process pages 2 through 10
  for (let pageNum = 2; pageNum <= 10; pageNum++) {
    console.log(`\n=== Processing page ${pageNum} ===`);
    
    // Click page number
    const pageBtn = adPage.locator(`button:has-text("${pageNum}"), a:has-text("${pageNum}")`).first();
    const pageCount = await pageBtn.count();
    
    if (pageCount === 0) {
      console.log(`Page ${pageNum} button not found, stopping`);
      break;
    }
    
    await pageBtn.click();
    console.log(`Navigated to page ${pageNum}`);
    await adPage.waitForTimeout(2000);
    
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
    
    // Apply
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
    
    console.log(`Page ${pageNum} apply: ${applied}`);
    await adPage.waitForTimeout(2000);
  }
  
  // Go back to page 1 to verify status
  console.log('\n=== Going back to page 1 for verification ===');
  const page1Btn = adPage.locator('button:has-text("1"), a:has-text("1")').first();
  if (await page1Btn.count() > 0) {
    await page1Btn.click();
    await adPage.waitForTimeout(2000);
  }
  
  const text = await adPage.evaluate(() => document.body.innerText);
  
  // Find keyword bid info in the table
  console.log('=== VERIFICATION ===');
  const lines = text.split('\n');
  let foundKeywords = 0;
  for (const line of lines) {
    if (line.includes('원') && line.length < 30) {
      const trimmed = line.trim();
      if (trimmed.match(/^\d{1,3}(,\d{3})*원$/)) {
        console.log('Bid value:', trimmed);
      }
    }
  }
  
  // Check for keyword lines with 1,500
  const keywordLines = lines.filter(l => l.includes('1,500') && l.length < 50);
  console.log(`Keywords showing 1,500원: ${keywordLines.length}`);
  keywordLines.forEach(l => console.log(`  ${l.trim()}`));
  
  console.log(`\nTotal keywords in text (includes mentions of 키워드): ${(text.match(/키워드/g) || []).length}`);
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
