const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const context = browser.contexts()[0];
  const page = await context.newPage();
  
  // Intercept network requests to find API
  const apiCalls = [];
  page.on('response', response => {
    const url = response.url();
    if (url.includes('api') || url.includes('keyword') || url.includes('rank') || url.includes('data') || url.includes('trend')) {
      apiCalls.push({ url, status: response.status() });
    }
  });
  
  try {
    console.log('Navigating to Blokey...');
    await page.goto('https://blokey.co.kr', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(5000);
    
    console.log('\n=== API CALLS DETECTED ===');
    apiCalls.forEach(call => {
      console.log(`[${call.status}] ${call.url}`);
    });
    
    // Try to get keywords from the rendered page
    const keywords = await page.evaluate(() => {
      const results = [];
      
      // Look at the main content area
      const main = document.querySelector('main, #root, #app, [class*="content"], [class*="container"]');
      if (main) {
        console.log('Found main container');
      }
      
      // Get all visible text, looking for keyword patterns
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      let node;
      const textNodes = [];
      while (node = walker.nextNode()) {
        const text = node.textContent.trim();
        if (text.length > 2 && text.length < 80) {
          textNodes.push(text);
        }
      }
      
      return textNodes.slice(0, 200);
    });
    
    console.log('\n=== TEXT NODES (first 200) ===');
    keywords.forEach((k, i) => {
      if (i % 5 === 0) console.log('');
      console.log(`[${i}] ${k}`);
    });
    
    // Also get the full rendered HTML to find the data structure
    const html = await page.content();
    console.log('\n=== HTML SNIPPET (looking for keyword patterns) ===');
    // Find areas that might contain keyword data
    const match = html.match(/<[^>]*keyword[^>]*>|<[^>]*rank[^>]*>|<[^>]*trend[^>]*>/gi);
    if (match) {
      match.forEach(m => console.log(m));
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await page.close();
    await browser.disconnect();
  }
})();
