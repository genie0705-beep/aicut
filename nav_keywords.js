const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const pages = browser.contexts()[0].pages();
  const adPage = pages.find(p => p.url().includes('ads.naver.com'));
  if (!adPage) { console.log('Not found'); await browser.close(); return; }
  
  await adPage.bringToFront();
  await adPage.waitForTimeout(1000);
  
  // Click on the ad group name
  const links = adPage.locator('a:has-text("퀵스타트_파워링크#1_광고그룹#1")');
  const count = await links.count();
  console.log('Found ad group links:', count);
  
  if (count > 0) {
    await links.first().click();
    await adPage.waitForTimeout(3000);
    console.log('New URL:', adPage.url());
    
    const text = await adPage.evaluate(() => document.body.innerText);
    console.log(text.substring(0, 5000));
  } else {
    console.log('Ad group link not found');
    // Try finding all links
    const allLinks = await adPage.evaluate(() => {
      return Array.from(document.querySelectorAll('a')).map(a => ({
        text: a.textContent.substring(0, 80),
        href: a.href
      }));
    });
    console.log('All links:', JSON.stringify(allLinks, null, 2));
  }
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
