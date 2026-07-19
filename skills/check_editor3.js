const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();

  // Go to blog main page first
  console.log('Navigating to blog...');
  await page.goto('https://blog.naver.com/aicut', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(3000);
  
  console.log('URL:', page.url());
  console.log('Title:', await page.title());
  
  // Find 글쓰기 button or link
  const writeBtn = await page.evaluate(() => {
    // Look for any buttons/links related to writing
    const all = document.querySelectorAll('a, button, span, div');
    const results = [];
    all.forEach(el => {
      const text = el.textContent.trim();
      if (text.includes('글') || text.includes('쓰') || text.includes('post') || text.includes('write') || text.includes('작성')) {
        results.push({
          tag: el.tagName,
          text: text.slice(0, 50),
          href: el.href || '',
          id: el.id,
          cls: el.className.slice(0, 80)
        });
      }
    });
    return results.slice(0, 20);
  });
  
  console.log('\n=== Writing-related elements ===');
  writeBtn.forEach(w => console.log(JSON.stringify(w)));

  // Check for SE/smart editor on the page
  const se = await page.evaluate(() => {
    return {
      hasSE: typeof SmartEditor !== 'undefined',
      hasJindo: typeof nhn !== 'undefined',
      hasJindo2: typeof jindo !== 'undefined',
      bodyText: document.body.innerText.slice(0, 200)
    };
  });
  console.log('\n=== Editor check:', JSON.stringify(se));

  // Look for the content area / post list
  const content = await page.evaluate(() => {
    const main = document.querySelector('#content, main, .post, [class*="post"], [class*="list"]');
    if (main) return { tag: main.tagName, text: main.innerText.slice(0, 100) };
    return { nothing: true };
  });
  console.log('\n=== Content area:', JSON.stringify(content));

  // Check all visible links
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[href]'))
      .filter(a => a.offsetParent !== null)
      .slice(0, 30)
      .map(a => ({ text: a.textContent.trim().slice(0, 40), href: a.href.slice(0, 100) }));
  });
  console.log('\n=== Visible links ===');
  links.forEach(l => console.log(`  ${l.text} → ${l.href}`));
  
  // Check what blog framework is being used
  const blogInfo = await page.evaluate(() => {
    return {
      hasModule: typeof window.__NEXT_DATA__ !== 'undefined',
      scripts: Array.from(document.querySelectorAll('script[src]')).slice(0, 10).map(s => s.src.split('/').pop()),
      meta: Array.from(document.querySelectorAll('meta[name]')).slice(0, 10).map(m => `${m.getAttribute('name')}=${m.getAttribute('content')?.slice(0,40)}`)
    };
  });
  console.log('\n=== Blog info:', JSON.stringify(blogInfo));
})();
