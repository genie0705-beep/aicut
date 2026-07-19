const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  // 각 검색어에 대해
  const queries = [
    { name: '150W PD 충전기', q: '150W+PD+%EC%B6%A9%EC%A0%84%EA%B8%B0' },
    { name: 'HP PD 변환 케이블 100W', q: 'HP+PD+%EB%B3%80%ED%99%98%EC%BC%80%EC%9D%B4%EB%B8%94+100W' },
    { name: '게이밍 노트북 PD 충전기', q: '%EA%B2%8C%EC%9D%B4%EB%B0%8D+%EB%85%B8%ED%8A%B8%EB%B6%81+PD+%EC%B6%A9%EC%A0%84%EA%B8%B0+150W' },
    { name: 'HP 호환 PD-E 충전케이블', q: 'HP+PD-E+%EC%BC%80%EC%9D%B4%EB%B8%94+100W' },
  ];

  for (const q of queries) {
    console.log(`\n=== ${q.name} ===`);
    await page.goto('https://search.shopping.naver.com/search/all?query=' + q.q, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
    await sleep(3000);
    
    // 스크롤 다운
    await page.evaluate(() => window.scrollTo(0, 800));
    await sleep(3000);
    await page.evaluate(() => window.scrollTo(0, 1500));
    await sleep(3000);

    // 제품 목록 수집 - 다양한 선택자 시도
    const products = await page.evaluate(() => {
      const items = [];
      
      // 모든 텍스트에서 상품명처럼 보이는 것 수집
      const allText = document.body.innerText;
      const lines = allText.split('\n').filter(l => l.trim());
      
      // 가격이 있는 라인 찾기
      for (let i = 0; i < lines.length; i++) {
        const l = lines[i].trim();
        // 가격 패턴 (숫자,원)
        if (/^[0-9,]+원$/.test(l) && i > 0) {
          items.push({
            price: l,
            title: lines[i-1].substring(0, 80)
          });
        }
        // 스토어/판매처 패턴
        if ((l.includes('스토어') || l.includes('쇼핑몰') || l.includes('마켓')) && /^[0-9,]+원$/.test(lines[i+1])) {
          items.push({
            store: l,
            price: lines[i+1]
          });
        }
      }
      
      return items.slice(0, 20);
    });
    
    if (products.length) {
      console.log('  발견된 상품:');
      products.forEach((p, i) => console.log(`  ${i+1}. [${p.price}] ${p.title || ''} ${p.store || ''}`));
    } else {
      // raw 텍스트 출력 (일부)
      console.log('  상품 미발견, raw 텍스트:');
      const t = await page.evaluate(() => document.body.innerText);
      t.split('\n').filter(l => l.trim()).slice(25, 50).forEach(l => console.log('  ' + l.substring(0, 100)));
    }
  }

  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));
