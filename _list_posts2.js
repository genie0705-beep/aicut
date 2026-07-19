const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const page = pages[0] || await b.newPage();
  page.on('dialog', async d => { await d.dismiss(); });
  
  // Go to mobile blog main page
  await page.goto('https://m.blog.naver.com/aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(4000);
  
  console.log('URL:', page.url());
  
  // Get post links from the page
  const posts = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href*="/aicut/"]'));
    const seen = {};
    const results = [];
    links.forEach(l => {
      const href = l.href || '';
      const match = href.match(/\/aicut\/(\d+)/);
      if (match && !seen[match[1]]) {
        seen[match[1]] = true;
        const text = (l.textContent || '').replace(/\s+/g, ' ').trim().substring(0, 100);
        results.push({ id: match[1], text: text || '(no text)', href: href.substring(0, 120) });
      }
    });
    return results;
  });
  
  console.log('Found posts:', posts.length);
  posts.forEach((p, i) => console.log(`${i+1}. [${p.id}] ${p.text}`));
  
  // Also check the entire page text
  const pageText = await page.evaluate(() => document.body.innerText);
  console.log('\n--- PAGE TEXT (first 1000 chars) ---');
  console.log(pageText.substring(0, 1000));
  
  process.exit(0);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
