const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const context = browser.contexts()[0];
  const page = await context.newPage();
  
  try {
    // Visit the real-time trends section
    console.log('=== NAVIGATING TO 실시간 트렌드 ===');
    await page.goto('https://blokey.co.kr/trends', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    let bodyText = await page.evaluate(() => document.body.innerText);
    console.log(bodyText.slice(0, 5000));
    
    // Also check the golden keyword page
    console.log('\n\n=== NAVIGATING TO 황금키워드 ===');
    await page.goto('https://blokey.co.kr/golden', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    bodyText = await page.evaluate(() => document.body.innerText);
    console.log(bodyText.slice(0, 5000));
    
    // Check if there's a keyword analysis page
    console.log('\n\n=== CHECKING KEYWORD ANALYSIS ===');
    await page.goto('https://blokey.co.kr/keyword', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    bodyText = await page.evaluate(() => document.body.innerText);
    console.log(bodyText.slice(0, 5000));
    
    // Also check the golden-live or keyword search page
    console.log('\n\n=== CHECKING GOLDEN LIVE ===');
    await page.goto('https://blokey.co.kr/goldenLIVE', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    bodyText = await page.evaluate(() => document.body.innerText);
    console.log(bodyText.slice(0, 5000));
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await page.close();
  }
})();
