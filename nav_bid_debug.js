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
  
  // Debug: Get all text in the page focusing on the modal area
  const fullHtml = await adPage.evaluate(() => {
    // Get all visible text nodes
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    const results = [];
    let node;
    while (node = walker.nextNode()) {
      const text = node.textContent.trim();
      const parent = node.parentElement;
      if (text && text.length > 0) {
        const rect = parent.getBoundingClientRect();
        results.push({
          text: text.substring(0, 80),
          y: Math.round(rect.y),
          x: Math.round(rect.x),
          tag: parent.tagName
        });
      }
    }
    
    // Sort by position
    results.sort((a, b) => a.y - b.y || a.x - b.x);
    
    // Only show last part (dialog area)
    const lastPart = results.filter(r => r.y > 700 && r.y < 1100);
    return lastPart;
  });
  
  console.log('Modal area elements:');
  fullHtml.forEach(r => console.log(`  y=${r.y} x=${r.x} <${r.tag}>: ${r.text}`));
  
  // Look for input[type="text"] in the modal
  const inputs = await adPage.evaluate(() => {
    const allInputs = document.querySelectorAll('input');
    return Array.from(allInputs).map(i => ({
      type: i.type,
      placeholder: i.placeholder,
      className: i.className?.substring(0, 50),
      rect: {
        x: i.getBoundingClientRect().x,
        y: i.getBoundingClientRect().y,
        width: i.getBoundingClientRect().width,
        height: i.getBoundingClientRect().height
      },
      value: i.value,
      visible: i.offsetParent !== null
    }));
  });
  
  console.log('\nAll inputs:');
  inputs.forEach(i => console.log(`  type=${i.type} value="${i.value}" visible=${i.visible} y=${i.rect.y}: ${i.placeholder || ''}`));
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
