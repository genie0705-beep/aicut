const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const context = browser.contexts()[0];
  const page = await context.newPage();
  
  try {
    console.log('Navigating to Blokey...');
    await page.goto('https://blokey.co.kr', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(5000);
    
    // Extract all keyword data from the rendered page
    const data = await page.evaluate(() => {
      const results = [];
      
      // Method 1: Find all elements that might contain keywords
      const keywordElements = document.querySelectorAll(
        'a[href*="keyword"], [class*="keyword"], [class*="rank"], [class*="trend"], ' +
        '[class*="item"], [class*="card"], [class*="list"], li, ' +
        'div[class*="grid"] > div, div[class*="container"] > div, ' +
        'table tr, [role="listitem"], [role="button"]'
      );
      
      keywordElements.forEach(el => {
        const text = el.textContent.trim();
        // Filter out very short or very long text, or boilerplate
        if (text.length > 3 && text.length < 200 && 
            !text.includes('검색') && 
            !text.includes('로그인') && 
            !text.includes('회원') &&
            !text.includes('블로키') &&
            el.children.length <= 3) {
          results.push(text);
        }
      });
      
      return { total: results.length, items: results.slice(0, 100) };
    });
    
    console.log('Total elements found:', data.total);
    console.log('\n=== KEYWORD ELEMENTS ===');
    data.items.forEach((item, i) => console.log(`[${i+1}] ${item}`));
    
    // Method 2: Get full body text and look for keyword-like patterns
    const fullText = await page.evaluate(() => document.body.innerText);
    console.log('\n=== FULL BODY TEXT ===');
    console.log(fullText.slice(0, 8000));
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await page.close();
    // Don't use browser.disconnect - not available on all Playwright versions
  }
})();
