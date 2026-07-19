const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page = pages[0];
  if (!page) { page = await b.newPage(); }
  page.on('dialog', async d => { await d.dismiss(); });
  
  await page.goto('https://admin.blog.naver.com/aicut/stat/today', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(5000);
  
  // Search for JSON data in the page HTML
  const jsonData = await page.evaluate(() => {
    const html = document.documentElement.innerHTML;
    
    // Find patterns like __INITIAL_STATE__, __NEXT_DATA__, or similar
    const patterns = [
      /window\.__INITIAL_STATE__\s*=\s*({.+?});/,
      /window\.__PRELOADED_STATE__\s*=\s*({.+?});/,
      /window\.__DATA__\s*=\s*({.+?});/,
      /window\.__NUXT__\s*=\s*({.+?});/,
      /__NEXT_DATA__[^>]*>({.+?})</,
      /initialData\s*[:=]\s*({.+?})(?:,|;|\n)/,
      /rankPVData\s*[:=]\s*({.+?})(?:,|;|\n)/
    ];
    
    for (const p of patterns) {
      const match = html.match(p);
      if (match) {
        return { pattern: p.toString().substring(0, 40), data: match[1].substring(0, 500) };
      }
    }
    return 'no JSON data found';
  });
  console.log('JSON data in page:', JSON.stringify(jsonData).substring(0, 500));
  
  // Find all data attributes and JSON-like content with post IDs
  const postData = await page.evaluate(() => {
    const html = document.documentElement.innerHTML;
    // Look for post IDs (numbers like 224346527054)
    const postIds = html.match(/2243\d{10}/g);
    
    // Look for rank-related data
    const rankData = html.match(/rank[^<]{0,100}/gi);
    
    return {
      postIds: postIds ? [...new Set(postIds)].slice(0, 10) : 'none',
      rankMatches: rankData ? rankData.slice(0, 5) : 'none'
    };
  });
  console.log('\nPost data:', JSON.stringify(postData, null, 2));
  
  // Try to use the page's actual navigation by creating an anchor click with URL
  await page.evaluate(() => {
    // Try Programmatic location change
    const link = document.querySelector('#all_stat_rank_pv');
    if (link) {
      // Naver blog admin uses a global click handler with nclk
      // Try calling the click handler directly
      const handler = link.getAttribute('onclick');
      console.log('ONCLICK:', handler);
      
      // Try href navigation
      window.location.href = link.href;
    }
  });
  
  await page.waitForTimeout(5000);
  
  console.log('After nav URL:', page.url());
  const text = await page.evaluate(() => document.body.innerText);
  console.log('After nav text:', text.substring(0, 3000));
  
  process.exit(0);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
