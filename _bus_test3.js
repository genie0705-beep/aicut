const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const page = await browser.contexts()[0].newPage();
  
  await page.goto('https://www.airportlimousine.co.kr/sub/sub01.php', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(1000);
  
  // Click on 6008 link first
  const link = page.locator('a').filter({ hasText: '6008' }).first();
  await link.click();
  await page.waitForTimeout(1500);
  
  // Click the 프레비뉴 link
  const stopLink = page.locator('a').filter({ hasText: '프레비뉴' }).first();
  await stopLink.click();
  await page.waitForTimeout(2000);
  
  // Get all text from the page (including any popups)
  const text = await page.evaluate(() => document.body.innerText);
  console.log(text);
  
  await browser.close();
})().catch(e => console.error(e.message));
