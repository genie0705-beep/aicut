const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const pages = browser.contexts()[0].pages();
  const adPage = pages.find(p => p.url().includes('ads.naver.com'));
  if (!adPage) { console.log('Not found'); await browser.close(); return; }
  
  await adPage.bringToFront();
  await adPage.waitForTimeout(1000);
  
  // Navigate directly to the ad group
  await adPage.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566', { waitUntil: 'networkidle' });
  await adPage.waitForTimeout(3000);
  
  // Find and click the "입찰가 변경" button
  const buttons = await adPage.evaluate(() => {
    const allButtons = document.querySelectorAll('button, a, span, div');
    const results = [];
    allButtons.forEach(el => {
      const text = el.textContent.trim();
      if (text.includes('입찰가 변경') || text.includes('입찰가변경')) {
        results.push({
          tag: el.tagName,
          text: text.substring(0, 30),
          rect: {
            x: el.getBoundingClientRect().x,
            y: el.getBoundingClientRect().y,
            width: el.getBoundingClientRect().width,
            height: el.getBoundingClientRect().height
          },
          visible: el.offsetParent !== null,
          class: el.className?.substring(0, 50)
        });
      }
    });
    return results;
  });
  
  console.log('Bid change buttons:', JSON.stringify(buttons, null, 2));
  
  // Also check for empty areas we can click
  // Let's find the checkbox in the first row
  const checkboxes = await adPage.evaluate(() => {
    const cbs = document.querySelectorAll('input[type="checkbox"]');
    return Array.from(cbs).map(cb => ({
      rect: {
        x: cb.getBoundingClientRect().x,
        y: cb.getBoundingClientRect().y,
        width: cb.getBoundingClientRect().width,
        height: cb.getBoundingClientRect().height
      },
      visible: cb.offsetParent !== null
    }));
  });
  
  console.log('Checkboxes found:', checkboxes.length);
  console.log(JSON.stringify(checkboxes, null, 2));
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
