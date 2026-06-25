const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const pages = browser.contexts()[0].pages();
  const adPage = pages.find(p => p.url().includes('ads.naver.com'));
  if (!adPage) { console.log('Not found'); await browser.close(); return; }
  
  await adPage.bringToFront();
  await adPage.waitForTimeout(1000);
  
  // Go to the ad group page
  await adPage.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566', { waitUntil: 'networkidle' });
  await adPage.waitForTimeout(3000);
  
  // Close any modal
  await adPage.evaluate(() => {
    document.querySelectorAll('button').forEach(btn => {
      if (btn.textContent.trim() === '닫기' && btn.offsetParent !== null) btn.click();
    });
  });
  await adPage.waitForTimeout(500);
  
  // Click "새 키워드" button
  const newKwBtn = adPage.locator('button:has-text("새 키워드"), span:has-text("새 키워드")').first();
  console.log('New keyword button:', await newKwBtn.count());
  
  // Try clicking via evaluate first
  const clicked = await adPage.evaluate(() => {
    const buttons = document.querySelectorAll('button, span, a');
    for (const btn of buttons) {
      if (btn.textContent.trim() === '새 키워드' && btn.offsetParent !== null) {
        btn.click();
        return true;
      }
    }
    return false;
  });
  
  console.log('Clicked new keyword:', clicked);
  await adPage.waitForTimeout(3000);
  
  // Check what appeared
  const text = await adPage.evaluate(() => document.body.innerText);
  
  // Look for input fields or modal related to new keyword
  const inputs = await adPage.evaluate(() => {
    const allInputs = document.querySelectorAll('input, textarea');
    return Array.from(allInputs).slice(-10).map(i => ({
      type: i.type || 'textarea',
      placeholder: i.placeholder?.substring(0, 50),
      value: i.value?.substring(0, 50),
      visible: i.offsetParent !== null,
      y: i.getBoundingClientRect().y
    }));
  });
  
  console.log('Recent inputs:', JSON.stringify(inputs, null, 2));
  
  // See if there's a modal/textarea for keyword entry
  console.log('\nLooking for keyword entry area...');
  const keywordArea = text.substring(Math.max(0, text.indexOf('새 키워드') - 100), Math.min(text.length, text.indexOf('새 키워드') + 500));
  console.log(keywordArea);
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
