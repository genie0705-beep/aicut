const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const page = pages[0] || await b.newPage();
  page.on('dialog', async d => { await d.dismiss(); });
  
  // Go to aicut blog list
  await page.goto('https://blog.naver.com/PostList.naver?blogId=aicut&widgetTypeCall=true&directAccess=true', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  // Get all post links
  const posts = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'));
    const seen = {};
    const results = [];
    links.forEach(l => {
      const href = l.href || '';
      const match = href.match(/blog\.naver\.com\/aicut\/(\d+)/);
      if (match && !seen[match[1]]) {
        seen[match[1]] = true;
        const text = (l.textContent || '').replace(/\s+/g, ' ').trim().substring(0, 100);
        if (text) {
          results.push({ id: match[1], text: text, href: href.substring(0, 120) });
        }
      }
    });
    return results;
  });
  
  console.log('=== AICUT BLOG POSTS ===');
  posts.forEach((p, i) => console.log(`${i+1}. [${p.id}] ${p.text}`));
  
  process.exit(0);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
