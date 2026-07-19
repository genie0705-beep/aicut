const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  // 아트뮤 GX410 150W - 상품 리뷰 확인
  console.log('=== 아트뮤 GX410 150W 리뷰 확인 ===');
  await page.goto('https://www.coupang.com/vp/products/8594336446', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await sleep(4000);
  
  // 스크롤 다운 (리뷰 영역)
  await page.evaluate(() => window.scrollTo(0, 3000));
  await sleep(3000);
  
  const artmu = await page.evaluate(() => {
    const text = document.body.innerText;
    const result = {};
    
    // 제품명
    const title = document.querySelector('h1, h2');
    result.title = title ? title.textContent.trim().substring(0, 100) : 'N/A';
    
    // 가격
    const priceMatch = text.match(/[0-9,]+원/g);
    result.prices = priceMatch ? [...new Set(priceMatch)].slice(0, 5) : [];
    
    // HP / Victus / 게이밍 관련 리뷰 찾기
    const lines = text.split('\n').filter(l => l.trim());
    const compat = lines.filter(l => {
      const lower = l.toLowerCase();
      return (lower.includes('hp') || lower.includes('victus') || lower.includes('게이밍') || 
              lower.includes('150w') || lower.includes('노트북') || lower.includes('호환')) &&
             l.length < 150;
    });
    result.compat = compat.slice(0, 15);
    
    // 할인 정보
    const saleMatch = text.match(/[0-9]+%/g);
    result.sale = saleMatch ? [...new Set(saleMatch)] : [];
    
    // 평점
    const ratingMatch = text.match(/[0-9.]+점/) || text.match(/평점[^0-9]*([0-9.]+)/);
    result.rating = ratingMatch ? ratingMatch[0] || ratingMatch[1] : '';
    
    return result;
  });

  console.log(`  제품: ${artmu.title}`);
  console.log(`  가격: ${artmu.prices?.join(', ')}`);
  console.log(`  할인: ${artmu.sale?.join(', ')}`);
  console.log(`  평점: ${artmu.rating}`);
  console.log('  호환 관련:');
  artmu.compat.forEach(l => console.log(`    ${l}`));

  // ==========================================
  // 슬림큐 F240 게이밍 노트북 충전기 검색
  // ==========================================
  console.log('\n\n=== 슬림큐 F240 240W GaN 검색 ===');
  await page.goto('https://www.coupang.com/np/search?q=%EC%8A%AC%EB%A6%BC%ED%81%90+F240+240W+GaN+%EC%B6%A9%EC%A0%84%EA%B8%B0', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await sleep(4000);
  const slimQ = await page.evaluate(() => {
    const text = document.body.innerText;
    const lines = text.split('\n').filter(l => l.trim());
    const gaming = lines.filter(l => l.includes('HP') || l.includes('Victus') || l.includes('게이밍') || l.includes('240W') || l.includes('GaN'));
    return gaming.slice(0, 15);
  });
  slimQ.forEach(l => console.log('  ' + l));

  // ==========================================
  // HP Victus 호환 PD 변환 케이블 검색
  // ==========================================
  console.log('\n\n=== HP Victus PD 변환 케이블 검색 ===');
  await page.goto('https://www.coupang.com/np/search?q=HP+Victus+PD+%EB%B3%80%ED%99%98+%EC%BC%80%EC%9D%B4%EB%B8%94', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await sleep(4000);
  await page.evaluate(() => window.scrollTo(0, 1000));
  await sleep(2000);

  const cableData = await page.evaluate(() => {
    const aTags = document.querySelectorAll('a');
    const items = [];
    const seen = new Set();
    for (const a of aTags) {
      const t = a.textContent.trim();
      if (t.length > 15 && t.length < 150 && (a.href || '').includes('coupang.com/vp/')) {
        const key = t.substring(0, 30);
        if (!seen.has(key)) {
          seen.add(key);
          items.push(t.substring(0, 100));
        }
      }
    }
    return items.slice(0, 10);
  });

  if (cableData.length > 0) {
    cableData.forEach((item, i) => console.log(`  ${i+1}. ${item}`));
  } else {
    const text = await page.evaluate(() => document.body.innerText);
    text.split('\n').filter(l => l.trim() && (l.includes('HP') || l.includes('PD') || l.includes('변환'))).slice(0, 8).forEach(l => console.log('  ' + l.substring(0, 100)));
  }

  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 80)));
