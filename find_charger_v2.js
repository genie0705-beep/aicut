const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  // 쿠팡 검색
  const searches = [
    { site: '쿠팡', url: 'https://www.coupang.com/np/search?component=&q=150W+PD+%EC%B6%A9%EC%A0%84%EA%B8%B0&channel=user' },
    { site: '쿠팡', url: 'https://www.coupang.com/np/search?q=HP+PD+%EB%B3%80%ED%99%98+%EC%BC%80%EC%9D%B4%EB%B8%94&channel=user' },
    { site: '쿠팡', url: 'https://www.coupang.com/np/search?q=HP+%EC%8A%A4%EB%A7%88%ED%8A%B8%ED%95%80+PD+100W&channel=user' },
  ];

  for (const s of searches) {
    console.log(`\n━━━ ${s.site}: ${s.url.split('q=')[1]?.split('&')[0] || ''} ━━━`);
    await page.goto(s.url, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
    await sleep(4000);
    
    await page.evaluate(() => window.scrollBy(0, 600));
    await sleep(2000);

    const data = await page.evaluate(() => {
      const items = [];
      // 쿠팡 상품 목록
      document.querySelectorAll('[class*="product"], [class*="search-product"], a[class*="baby-product"]').forEach(el => {
        const t = el.textContent.trim();
        if (t && t.length > 8 && t.length < 150) {
          const h = el.href || '';
          items.push({ text: t.substring(0, 100), href: h.substring(0, 100) });
        }
      });
      // 모든 링크에서 상품명 찾기
      if (items.length === 0) {
        document.querySelectorAll('a').forEach(a => {
          const t = a.textContent.trim();
          if (t.length > 15 && t.length < 120 && a.href && a.href.includes('coupang.com/vp/product')) {
            items.push({ text: t.substring(0, 100), href: a.href.substring(0, 100) });
          }
        });
      }
      return items.length > 0 ? items.slice(0, 10) : [];
    });

    if (data.length > 0) {
      data.forEach((d, i) => console.log(`  ${i+1}. ${d.text}`));
    } else {
      // raw text
      const t = await page.evaluate(() => document.body.innerText);
      t.split('\n').filter(l => l.trim()).slice(10, 30).forEach(l => console.log('  ' + l.substring(0, 100)));
    }
  }

  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 80)));
