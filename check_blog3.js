const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const pages = browser.contexts()[0].pages();
  const blogTab = pages.find(p => p.url().includes('section.blog.naver.com'));
  if (!blogTab) { console.log('Blog tab not found'); await browser.close(); return; }
  await blogTab.bringToFront();
  await blogTab.waitForTimeout(1000);
  
  // Go to blog search results
  await blogTab.goto('https://section.blog.naver.com/Search/Post.naver?pageNo=1&rangeType=ALL&orderBy=sim&keyword=%EC%98%81%EC%83%81%ED%8E%B8%EC%A7%91', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await blogTab.waitForTimeout(3000);
  
  // Find all links that point to blog posts
  const blogLinks = await blogTab.evaluate(() => {
    const allLinks = document.querySelectorAll('a');
    const results = [];
    allLinks.forEach(a => {
      const href = a.href;
      if (href && href.includes('blog.naver.com/')) {
        results.push({
          text: a.textContent.trim().substring(0, 50),
          href: href.substring(0, 120),
          class: a.className?.substring(0, 60)
        });
      }
    });
    return results;
  });
  
  console.log('Blog links found:', blogLinks.length);
  blogLinks.slice(0, 20).forEach(l => console.log(`  [${l.class}] ${l.text}: ${l.href}`));
  
  // Also check for the card/article containers
  const containers = await blogTab.evaluate(() => {
    const results = [];
    // Look for article/card containers
    const cards = document.querySelectorAll('[class*="card"], [class*="Card"], [class*="post"], [class*="Post"], [class*="item"], [class*="Item"], article, li');
    cards.forEach(c => {
      if (c.querySelector('a') && c.offsetParent !== null) {
        const firstLink = c.querySelector('a');
        if (firstLink && firstLink.href && firstLink.href.includes('blog.naver.com')) {
          results.push({
            tag: c.tagName,
            class: c.className?.substring(0, 80)
          });
        }
      }
    });
    return results;
  });
  
  console.log('\nPost containers:');
  containers.forEach(c => console.log(`  <${c.tag}> class=${c.class}`));
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
