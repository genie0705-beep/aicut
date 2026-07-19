const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  const queries = [
    { name: '🔌 150W PD 충전기', q: '150W PD 충전기' },
    { name: '🔌 PD 150W GaN 충전기', q: 'PD 150W GaN 충전기' },
    { name: '🔌 100W PD GaN 충전기', q: '100W PD GaN 충전기' },
    { name: '🔌 HP PD 변환케이블 100W', q: 'HP PD 변환케이블 100W' },
    { name: '🔌 HP 노트북 PD 충전 케이블', q: 'HP 노트북 PD 충전 케이블' },
    { name: '🔌 HP 스마트핀 PD 케이블', q: 'HP 스마트핀 PD 케이블' },
  ];

  for (const q of queries) {
    console.log(`\n━━━ ${q.name} ━━━`);
    const encoded = encodeURIComponent(q.q);
    await page.goto('https://search.shopping.naver.com/search/all?query=' + encoded, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
    await sleep(3000);
    
    // 스크롤
    await page.evaluate(() => window.scrollBy(0, 1000));
    await sleep(2000);
    await page.evaluate(() => window.scrollBy(0, 1000));
    await sleep(2000);

    // 상품 링크와 정보 수집
    const items = await page.evaluate(() => {
      const result = [];
      // 모든 a 태그 중 상품 링크 찾기
      const links = document.querySelectorAll('a[href*="/products/"], a[class*="product"], a[class*="item"]');
      links.forEach(a => {
        const title = a.textContent.trim();
        const href = a.href || '';
        if (title && title.length > 5 && title.length < 120) {
          result.push({ title, href: href.substring(0, 120) });
        }
      });
      
      // 상품명 + 가격 조합 찾기
      const allText = document.body.innerText;
      const lines = allText.split('\n').filter(l => l.trim());
      
      return {
        links: result.slice(0, 10),
        lines: lines.slice(25, 45)
      };
    });

    if (items.links && items.links.length > 0) {
      console.log('  [상품 목록]');
      items.links.forEach((item, i) => console.log(`  ${i+1}. ${item.title.substring(0, 80)}`));
    } else {
      console.log('  [검색 결과]');
      items.lines.forEach(l => console.log('    ' + l.substring(0, 100)));
    }
  }

  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 80)));
