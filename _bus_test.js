const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const page = await browser.contexts()[0].newPage();
  
  await page.goto('https://www.airportlimousine.co.kr/sub/sub01.php', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(1000);
  
  // Click on 6008 link
  const link = page.locator('a').filter({ hasText: '6008' }).first();
  await link.click();
  await page.waitForTimeout(2500);
  
  const text = await page.evaluate(() => document.body.innerText);
  console.log(text.substring(0, 8000));
  
  await browser.close();
})().catch(e => console.error(e.message));
