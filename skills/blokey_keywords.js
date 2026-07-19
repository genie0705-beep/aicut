const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to Blokey...');
    await page.goto('https://blokey.co.kr', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    // Try to find the real-time keyword data
    // Blokey is a SPA, let's look for the data
    
    // Check if there's a specific section for real-time keywords
    const title = await page.title();
    console.log('Page title:', title);
    
    // Try to find keyword elements - common patterns
    const keywords = await page.evaluate(() => {
      const results = [];
      
      // Look for any list items, divs with keywords
      const allElements = document.querySelectorAll('*');
      
      // Try to find sections that might contain keyword data
      const sections = document.querySelectorAll('section, div[class*="keyword"], div[class*="trend"], div[class*="rank"], ul, ol');
      
      sections.forEach(section => {
        const text = section.textContent.trim();
        if (text.length > 0 && text.length < 500) {
          // Look for table/list-like structures
          const items = section.querySelectorAll('li, tr, div[class*="item"], div[class*="card"]');
          if (items.length > 0) {
            items.forEach(item => {
              const itemText = item.textContent.trim();
              if (itemText && itemText.length < 100) {
                results.push(itemText);
              }
            });
          }
        }
      });
      
      return results;
    });
    
    console.log('Found elements:', keywords.slice(0, 50));
    
    // Get full text content of the page
    const bodyText = await page.evaluate(() => {
      return document.body.innerText;
    });
    
    console.log('\n=== PAGE TEXT CONTENT (first 5000 chars) ===');
    console.log(bodyText.slice(0, 5000));
    
    // Check for API calls that Blokey might make
    const apiEndpoints = await page.evaluate(() => {
      // Look for script tags with JSON data
      const scripts = document.querySelectorAll('script');
      const results = [];
      scripts.forEach(script => {
        const content = script.textContent || '';
        if (content.includes('keyword') || content.includes('rank') || content.includes('data')) {
          results.push(content.slice(0, 300));
        }
      });
      return results;
    });
    
    console.log('\n=== SCRIPTS WITH KEYWORD DATA ===');
    apiEndpoints.forEach((s, i) => {
      console.log(`\n--- Script ${i+1} ---`);
      console.log(s);
    });
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await page.close();
    await browser.disconnect();
  }
})();
