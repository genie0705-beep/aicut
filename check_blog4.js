const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const pages = browser.contexts()[0].pages();
  const blogTab = pages.find(p => p.url().includes('section.blog.naver.com'));
  if (!blogTab) { console.log('Blog tab not found'); await browser.close(); return; }
  await blogTab.bringToFront();
  
  await blogTab.goto('https://section.blog.naver.com/Search/Post.naver?pageNo=1&rangeType=ALL&orderBy=sim&keyword=%EC%98%81%EC%83%81%ED%8E%B8%EC%A7%91', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await blogTab.waitForTimeout(3000);
  
  // Check blog post links in detail
  const postData = await blogTab.evaluate(() => {
    const posts = document.querySelectorAll('.list_search_post .item');
    const results = [];
    posts.forEach(post => {
      // Find all links
      const links = post.querySelectorAll('a');
      const linkData = [];
      links.forEach(a => {
        if (a.href && !a.href.includes('#')) {
          linkData.push({
            href: a.href?.substring(0, 150),
            text: a.textContent?.trim()?.substring(0, 40),
            class: a.className?.substring(0, 50)
          });
        }
      });
      
      // Also find the blogId/author info
      const authorEl = post.querySelector('[class*="writer"], [class*="author"], [class*="blog_id"], [class*="nick"]');
      
      if (linkData.length > 0) {
        results.push({
          links: linkData,
          author: authorEl?.textContent?.trim()?.substring(0, 30) || ''
        });
      }
    });
    return results;
  });
  
  console.log('Posts found:', postData.length);
  postData.slice(0, 5).forEach((p, i) => {
    console.log(`\nPost ${i+1}:`);
    console.log(`  Author: ${p.author}`);
    p.links.forEach(l => console.log(`  [${l.class}] ${l.text}`));
    console.log(`  First real link: ${p.links[0]?.href}`);
  });
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
