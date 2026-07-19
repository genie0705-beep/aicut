const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const page = await browser.contexts()[0].newPage();
  
  await page.goto('https://www.airportlimousine.co.kr/sub/sub01.php', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(1000);
  
  // Click on 6008 link first
  const link = page.locator('a').filter({ hasText: '6008' }).first();
  await link.click();
  await page.waitForTimeout(2000);
  
  // Get the full HTML to see structure
  const html = await page.evaluate(() => document.getElementById('container')?.innerHTML || document.body.innerHTML);
  // Look for time table or stop info
  const stopSection = html.match(/프레비뉴[^<]*/);
  console.log('Match:', JSON.stringify(stopSection));
  
  // Try to click on all a tags containing 프레비뉴
  const allLinks = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'));
    return links.filter(l => l.textContent.includes('프레비뉴')).map(l => ({
      text: l.textContent.trim(),
      href: l.href,
      onclick: l.getAttribute('onclick')
    }));
  });
  console.log('Links with 프레비뉴:', JSON.stringify(allLinks));
  
  // Also look for popup or modal
  const popups = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('*')).filter(el => 
      el.style && (el.style.display === 'none' || el.className.includes('pop') || el.className.includes('modal'))
    ).length;
  });
  console.log('Hidden/popup elements count:', popups);
  
  await browser.close();
})().catch(e => console.error(e.message));
