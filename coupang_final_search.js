const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  // 검색 결과 페이지에서 상품 정보 + 리뷰 확인
  const targets = [
    // 아트뮤 GX410 검색
    { name: '아트뮤 GX410 150W', q: '아트뮤 PD3.1 150W PPS GaN 접지 멀티 초고속 충전기 GX410', productId: '8594336446' },
    // 지파워 PD150W 검색  
    { name: '지파워 PD150W', q: '지파워 GaN PD150W 4구 멀티형 노트북 태블릿 초고속충전기', productId: null },
    // 아트뮤 GX310 검색
    { name: '아트뮤 GX310 150W', q: '아트뮤 PD3.1 150W PPS GaN 접지 멀티 초고속 충전기 GX310', productId: null },
    // 컴스 IF975
    { name: '컴스 IF975 HP 변환젠더', q: '컴스 USB Type C 노트북 전원 변환젠더 IF975 HP 4.5', productId: '7959234910' },
    // 노트킹 변환젠더
    { name: '노트킹 HP 변환젠더', q: '노트킹 USB-C TO DC 4.5x3.0 100W HP 노트북 충전젠더', productId: null },
    // 에이치디탑 변환케이블
    { name: '에이치디탑 변환케이블', q: '에이치디탑 C타입 to DC PD100W 노트북 충전 케이블 4.5mm', productId: null },
    // 올리민 변환젠더
    { name: '올리민 HP 변환젠더', q: '올리민 USB3.1 C타입 PD to DC 변환 노트북 충전 젠더 4.5 3.0 HP', productId: null },
  ];

  for (const t of targets) {
    console.log(`\n━━━ ${t.name} ━━━`);
    
    // 검색
    await page.goto('https://www.coupang.com/np/search?q=' + encodeURIComponent(t.q), { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
    await sleep(3000);
    await page.evaluate(() => window.scrollBy(0, 500));
    await sleep(2000);

    // 상품 목록 추출
    const products = await page.evaluate(() => {
      const items = [];
      const links = document.querySelectorAll('a[href*="/vp/products/"]');
      const seen = new Set();
      for (const a of links) {
        const t = a.textContent.trim();
        if (t.length > 15 && t.length < 160) {
          const key = t.substring(0, 30);
          if (!seen.has(key)) {
            seen.add(key);
            // 가격 정보 주변에서 찾기
            const parent = a.closest('li, div[class*="product"], div[class*="search"]');
            const priceText = parent ? parent.textContent : '';
            const price = priceText.match(/([0-9,]+)원/);
            items.push({
              title: t.substring(0, 100),
              price: price ? price[1] + '원' : '',
              href: a.href
            });
          }
        }
      }
      return items.slice(0, 5);
    });

    if (products.length > 0) {
      products.forEach((p, i) => console.log(`  ${i+1}. ${p.title} | ${p.price}`));
      
      // 첫 번째 상품 클릭해서 상세페이지로
      if (products[0].href) {
        console.log(`  → 상세페이지 이동: ${products[0].href.substring(0, 70)}`);
        await page.goto(products[0].href, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
        await sleep(3000);
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.3));
        await sleep(2000);
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.7));
        await sleep(2000);

        const detail = await page.evaluate(() => {
          const text = document.body.innerText;
          const result = {};
          
          // 제품명
          const h = document.querySelector('h1, h2');
          result.title = h ? h.textContent.trim().substring(0, 80) : '';
          
          // 가격
          const prices = text.match(/([0-9,]+)원/g);
          result.prices = prices ? [...new Set(prices)].slice(0, 3) : [];
          
          // 평점
          const rate = text.match(/[0-9.]+점/) || text.match(/([0-9]+)%[^]*?(구매|평가)/);
          result.rating = rate ? rate[0] : '';
          
          // HP/Victus/게이밍 관련 텍스트
          const lines = text.split('\n');
          const hpLines = lines.filter(l => {
            const lower = l.toLowerCase();
            return (lower.includes('hp') || lower.includes('victus') || lower.includes('게이밍') || 
                    lower.includes('오멘') || lower.includes('파빌리온') || lower.includes('노트북') ||
                    lower.includes('호환') || lower.includes('compatible') || lower.includes('4.5mm')) &&
                   l.length < 150;
          });
          result.hpLines = hpLines.slice(0, 20);
          
          return result;
        });

        console.log(`  [${detail.title}]`);
        console.log(`  가격: ${detail.prices.join(', ')}`);
        console.log(`  평점: ${detail.rating}`);
        if (detail.hpLines.length > 0) {
          console.log(`  HP/Victus 관련 텍스트 (${detail.hpLines.length}개):`);
          detail.hpLines.forEach(l => console.log(`    → ${l.trim().substring(0, 120)}`));
        } else {
          console.log('  ❌ HP/Victus 관련 텍스트 없음');
        }
      }
    } else {
      console.log('  상품 목록 없음');
      const t = await page.evaluate(() => document.body.innerText);
      t.split('\n').filter(l => l.trim() && (l.includes('150W') || l.includes('PD') || l.includes('GaN'))).slice(0, 5).forEach(l => console.log('  ' + l.substring(0, 100)));
    }
  }

  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 80)));
