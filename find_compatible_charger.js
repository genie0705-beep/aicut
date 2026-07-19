const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  // Victus / HP 게이밍 노트북 호환 PD 충전기 검색
  const searches = [
    'HP Victus PD 충전기 호환',
    'HP 게이밍 노트북 PD 충전 150W',
    'Victus 15 PD 충전 케이블',
    'HP 스마트핀 4.5mm PD 100W',
    'HP 노트북 PD to DC 변환 Victus',
  ];

  for (const q of searches) {
    console.log(`\n━━━ ${q} ━━━`);
    const encoded = encodeURIComponent(q);
    await page.goto('https://www.coupang.com/np/search?q=' + encoded, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
    await sleep(3000);
    await page.evaluate(() => window.scrollBy(0, 800));
    await sleep(2000);

    // 첫 페이지 상품명 + 가격 수집
    const items = await page.evaluate(() => {
      const result = [];
      const links = document.querySelectorAll('a');
      const seen = new Set();
      for (const a of links) {
        const t = a.textContent.trim();
        if (t.length > 15 && t.length < 150 && (a.href || '').includes('coupang.com/vp/product')) {
          // 가격 추출
          const priceEl = a.closest('li, div')?.querySelector('[class*="price"], [class*="Price"], strong') ;
          const price = priceEl ? priceEl.textContent.trim() : '';
          const key = t.substring(0, 40);
          if (!seen.has(key)) {
            seen.add(key);
            result.push({ title: t.substring(0, 100), price: price.substring(0, 30) });
          }
        }
      }
      // 링크로 못 찾았으면 일반 텍스트에서 검색
      if (result.length === 0) {
        const text = document.body.innerText;
        const lines = text.split('\n').filter(l => l.trim());
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].length > 20 && lines[i].length < 150 && !lines[i].includes('전체') && !lines[i].includes('쿠팡')) {
            result.push({ title: lines[i].substring(0, 100), price: '' });
            if (result.length >= 8) break;
          }
        }
      }
      return result.slice(0, 8);
    });

    items.forEach((item, i) => console.log(`  ${i+1}. ${item.title} ${item.price ? '| ' + item.price : ''}`));
  }

  // ============================
  // 추가: 검색된 상품 중 HP/Victus 관련 상품 링크 직접 열기
  // ============================
  console.log('\n\n=== Victus 호환 가능 제품 상세 검색 ===');
  
  // 아트뮤 150W 제품 상세 페이지
  await page.goto('https://www.coupang.com/vp/products/8594336446', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await sleep(4000);
  await page.evaluate(() => window.scrollTo(0, 2000));
  await sleep(2000);
  
  // 상품 설명 리뷰 확인
  const reviews = await page.evaluate(() => {
    const text = document.body.innerText;
    const result = {};
    
    // 상품명
    const titleEl = document.querySelector('h1, h2, [class*="title"], [class*="product"]');
    result.title = titleEl ? titleEl.textContent.trim().substring(0, 80) : '';
    
    // 호환성 관련 텍스트
    const compatLines = text.split('\n').filter(l => l.trim() && (l.toLowerCase().includes('hp') || l.includes('victus') || l.includes('게이밍') || l.includes('노트북') || l.includes('호환') || l.includes('compatible')));
    result.compatInfo = compatLines.slice(0, 10);
    
    // 가격
    const priceMatch = text.match(/[0-9,]+원/);
    result.price = priceMatch ? priceMatch[0] : '';
    
    // 리뷰 평점
    const ratingMatch = text.match(/[0-9.]+점/) || text.match(/[0-9]+%[^]*?[0-9]+개의/);
    result.rating = ratingMatch ? ratingMatch[0] : '';

    // 상품 설명 미리보기
    result.preview = text.substring(0, 1000);
    
    return result;
  });

  if (reviews.title) {
    console.log(`\n[아트뮤 150W 상세]`);
    console.log(`  제품: ${reviews.title}`);
    console.log(`  가격: ${reviews.price}`);
    console.log(`  평점: ${reviews.rating}`);
    console.log(`  호환 정보:`);
    reviews.compatInfo.forEach(l => console.log(`    ${l.substring(0, 120)}`));
  }

  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 80)));
