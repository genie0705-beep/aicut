const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  const results = [];

  // 1. 아트뮤 GX410 150W - 상세페이지에서 리뷰 더 보기
  console.log('=== 아트뮤 GX410 150W - 리뷰 검색 ===');
  await page.goto('https://www.coupang.com/vp/products/8915834419', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await sleep(5000);
  
  // 끝까지 스크롤
  await page.evaluate(async () => {
    for (let i = 0; i < 5; i++) {
      window.scrollBy(0, 1500);
      await new Promise(r => setTimeout(r, 1500));
    }
  });
  await sleep(3000);

  let text = await page.evaluate(() => document.body.innerText);
  
  // 리뷰 내용 더미에서 Victus/HP/게이밍 찾기
  const victusMentions = text.split('\n').filter(l => {
    const lower = l.toLowerCase();
    return (lower.includes('victus') || lower.includes('15-fa') || lower.includes('victus 15') ||
            lower.includes('오멘') || lower.includes('hp 게이밍') || lower.includes('파빌리온 게이밍') ||
            lower.includes('110w') || lower.includes('130w') || lower.includes('pd 충전')) &&
           l.length < 200;
  });
  
  console.log(`  Victus/HP 게이밍 리뷰: ${victusMentions.length}개`);
  victusMentions.slice(0, 20).forEach(l => console.log(`    ${l.trim().substring(0, 120)}`));

  // 상품명/가격
  const titleMatch = text.match(/(아트뮤[^]*?150W[^]*?\d)/);
  const priceMatch = text.match(/([0-9,]+)원/);
  console.log(`  상품: ${titleMatch ? titleMatch[0].substring(0, 80) : 'N/A'}`);
  console.log(`  가격: ${priceMatch ? priceMatch[0] : 'N/A'}`);

  // 2. 지파워 PD150W 상세
  console.log('\n\n=== 지파워 GaN PD150W - 리뷰 검색 ===');
  await page.goto('https://www.coupang.com/vp/products/9597652568', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await sleep(5000);
  
  await page.evaluate(async () => {
    for (let i = 0; i < 5; i++) {
      window.scrollBy(0, 1500);
      await new Promise(r => setTimeout(r, 1500));
    }
  });
  await sleep(3000);

  text = await page.evaluate(() => document.body.innerText);
  
  const jpVictus = text.split('\n').filter(l => {
    const lower = l.toLowerCase();
    return (lower.includes('victus') || lower.includes('15-fa') || lower.includes('게이밍') ||
            lower.includes('hp') || lower.includes('오멘') || lower.includes('pd 충전')) &&
           l.length < 200;
  });
  
  console.log(`  Victus/HP 관련: ${jpVictus.length}건`);
  jpVictus.slice(0, 20).forEach(l => console.log(`    ${l.trim().substring(0, 120)}`));

  const jpPrice = text.match(/([0-9,]+)원/g);
  console.log(`  가격: ${jpPrice ? jpPrice[0] : 'N/A'}`);

  // 3. 상품평 더보기 클릭 시도 - 쿠팡 상품평 탭
  console.log('\n\n=== 아트뮤 GX410 - 상품평 탭 클릭 ===');
  await page.goto('https://www.coupang.com/vp/products/8915834419', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await sleep(4000);

  // 상품평 탭 찾아서 클릭
  const clicked = await page.evaluate(() => {
    const all = document.querySelectorAll('a, button, span, div');
    for (const el of all) {
      if (el.textContent.trim() === '상품평' || el.textContent.trim() === '리뷰' || el.textContent.includes('상품평')) {
        el.click();
        return el.textContent.trim();
      }
    }
    return null;
  });
  console.log(`  클릭: ${clicked || '버튼 없음'}`);
  await sleep(3000);

  // 리뷰 영역 스크롤
  await page.evaluate(async () => {
    for (let i = 0; i < 3; i++) {
      window.scrollBy(0, 1000);
      await new Promise(r => setTimeout(r, 1000));
    }
  });
  await sleep(2000);

  text = await page.evaluate(() => document.body.innerText);
  const reviewText = text.split('\n').filter(l => {
    const lower = l.toLowerCase();
    return (lower.includes('victus') || lower.includes('15-fa') || lower.includes('게이밍') ||
            lower.includes('hp') || lower.includes('pd') || lower.includes('충전')) &&
           l.length > 10 && l.length < 200;
  });
  console.log(`  리뷰에서 HP/게이밍 언급: ${reviewText.length}건`);
  reviewText.slice(0, 20).forEach(l => console.log(`    ${l.trim().substring(0, 120)}`));

  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 80)));
