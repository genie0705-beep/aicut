const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  const adsPage = pages.find(p => p.url().includes('ads.naver.com'));
  
  const baseUrl = 'https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566';
  await adsPage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 5000));
  
  // Extract all page button elements in pagination
  const pageNav = await adsPage.evaluate(() => {
    // Get all elements that might be page numbers
    const allEls = Array.from(document.querySelectorAll('*'));
    const pageEls = [];
    
    for (const el of allEls) {
      const text = (el.innerText || '').trim();
      // Match page numbers 1-12
      if (/^[1-9]$|^1[0-2]$/.test(text) && el.children.length === 0) {
        pageEls.push({
          tag: el.tagName,
          text: text,
          class: el.className?.slice(0, 50),
          rect: el.getBoundingClientRect()
        });
      }
    }
    
    return pageEls;
  });
  
  console.log('Page number elements found:', pageNav.length);
  pageNav.forEach(p => console.log(`  ${p.tag} | ${p.text} | class:${p.class} | x:${Math.round(p.rect.x)} y:${Math.round(p.rect.y)}`));
  
  // Try to find pagination container
  const paginationHtml = await adsPage.evaluate(() => {
    // Search for pagination pattern
    const text = document.body.innerText;
    const idx = text.indexOf('10 / 페이지');
    if (idx >= 0) {
      const before = text.slice(Math.max(0, idx - 200), idx + 200);
      return before;
    }
    return 'NOT FOUND';
  });
  
  console.log('\n--- Area around "10 / 페이지" ---');
  console.log(paginationHtml);
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
