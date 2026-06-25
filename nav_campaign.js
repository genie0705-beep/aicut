const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const pages = browser.contexts()[0].pages();
  const adPage = pages.find(p => p.url().includes('ads.naver.com'));
  if (!adPage) { console.log('Not found'); await browser.close(); return; }
  
  await adPage.bringToFront();
  await adPage.waitForTimeout(1000);
  
  // Click on the campaign name
  const links = adPage.locator('a:has-text("에이컷_영상편집_검색")');
  const count = await links.count();
  console.log('Found links:', count);
  
  if (count > 0) {
    await links.first().click();
    await adPage.waitForTimeout(3000);
    console.log('New URL:', adPage.url());
    
    const text = await adPage.evaluate(() => document.body.innerText);
    console.log(text.substring(0, 4000));
  } else {
    console.log('Campaign link not found with text search');
  }
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
