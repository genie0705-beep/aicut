const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  // HP Victus 15-fa2710TX 정품 어댑터 확인
  console.log('=== Victus 15-fa2710TX 정품 어댑터 스펙 확인 ===');
  await page.goto('https://www.coupang.com/np/search?q=HP+Victus+15-fa2710TX+%EC%A0%95%ED%92%88+%EC%96%B4%EB%8C%91%ED%84%B0+150W', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await sleep(4000);
  await page.evaluate(() => window.scrollBy(0, 600));
  await sleep(2000);
  
  let text = await page.evaluate(() => document.body.innerText);
  console.log('[정품 어댑터 검색 결과]');
  text.split('\n').filter(l => l.trim() && (l.toLowerCase().includes('hp') || l.includes('150W') || l.includes('Victus') || l.includes('어댑터') || l.includes('충전기')) && l.length > 10 && l.length < 150).slice(0, 10).forEach(l => console.log('  ' + l));

  // ==========================================
  // 아트뮤 GX410 150W - 리뷰에서 HP 찾기
  // ==========================================
  console.log('\n\n=== 아트뮤 GX410 150W - HP/Victus 리뷰 검색 ===');
  await page.goto('https://www.coupang.com/vp/products/8594336446', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(e => console.log('  페이지 접속 실패:', e.message.substring(0, 40)));
  await sleep(5000);

  // 리뷰 영역까지 스크롤
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.4));
  await sleep(2000);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.6));
  await sleep(2000);

  text = await page.evaluate(() => document.body.innerText);
  
  // HP / Victus / 게이밍 노트북 관련 리뷰 추출
  const artmuReviews = text.split('\n').filter(l => {
    const lower = l.toLowerCase();
    return (lower.includes('hp') || lower.includes('victus') || lower.includes('victus') || 
            lower.includes('게이밍') || lower.includes('오멘') || lower.includes('파빌리온') ||
            lower.includes('envy') || lower.includes('스펙터')) &&
           l.length < 150 && l.length > 5;
  });
  
  console.log(`  총 HP 관련 리뷰/텍스트: ${artmuReviews.length}개`);
  artmuReviews.slice(0, 20).forEach((l, i) => console.log(`  ${i+1}. ${l.trim().substring(0, 120)}`));

  // 제품명과 가격
  const title = await page.evaluate(() => {
    const h = document.querySelector('h1, h2');
    return h ? h.textContent.trim().substring(0, 100) : 'N/A';
  });
  const priceMatch = text.match(/[0-9,]+원/g);
  console.log(`  [${title}]`);
  console.log(`  가격: ${priceMatch ? priceMatch[0] : 'N/A'}`);
  
  // 평점
  const rating = text.match(/[0-9]+개의[^]*?평점/) || text.match(/평점[^0-9]*([0-9.]+)/);
  console.log(`  평점: ${rating ? rating[0] : 'N/A'}`);

  // ==========================================
  // 지파워 PD150W 리뷰 확인
  // ==========================================
  console.log('\n\n=== 지파워 GaN PD150W 리뷰 검색 ===');
  await page.goto('https://www.coupang.com/np/search?q=%EC%A7%80%ED%8C%8C%EC%9B%8C+GaN+PD150W', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await sleep(4000);
  
  // 첫 번째 상품 클릭
  const firstLink = await page.evaluate(() => {
    const links = document.querySelectorAll('a[href*="/vp/products/"]');
    for (const a of links) {
      if (a.href && a.textContent.trim().length > 10) return a.href;
    }
    return null;
  });

  if (firstLink) {
    console.log(`  상품 페이지: ${firstLink.substring(0, 80)}`);
    await page.goto(firstLink, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
    await sleep(4000);
    await page.evaluate(() => window.scrollTo(0, 1500));
    await sleep(3000);
    
    text = await page.evaluate(() => document.body.innerText);
    const jipowerHP = text.split('\n').filter(l => {
      const lower = l.toLowerCase();
      return (lower.includes('hp') || lower.includes('victus') || lower.includes('게이밍')) && l.length < 150;
    });
    console.log(`  HP 관련 리뷰: ${jipowerHP.length}개`);
    jipowerHP.slice(0, 10).forEach(l => console.log(`    ${l.trim().substring(0, 120)}`));
    
    const pTitle = await page.evaluate(() => {
      const h = document.querySelector('h1, h2');
      return h ? h.textContent.trim().substring(0, 80) : 'N/A';
    });
    const pPrice = text.match(/[0-9,]+원/g);
    console.log(`  [${pTitle}]`);
    console.log(`  가격: ${pPrice ? pPrice[0] : 'N/A'}`);
  }

  // ==========================================
  // 컴스 IF975 - HP 변환젠더 리뷰
  // ==========================================
  console.log('\n\n=== 컴스 IF975 HP 변환젠더 리뷰 ===');
  await page.goto('https://www.coupang.com/vp/products/7959234910', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await sleep(4000);
  await page.evaluate(() => window.scrollTo(0, 2000));
  await sleep(3000);

  text = await page.evaluate(() => document.body.innerText);
  const comsReviews = text.split('\n').filter(l => {
    const lower = l.toLowerCase();
    return (lower.includes('hp') || lower.includes('victus') || lower.includes('게이밍') || 
            lower.includes('오멘') || lower.includes('노트북') || lower.includes('4.5')) &&
           l.length < 150 && l.length > 5;
  });
  console.log(`  HP/노트북 관련: ${comsReviews.length}개`);
  comsReviews.slice(0, 15).forEach(l => console.log(`    ${l.trim().substring(0, 120)}`));

  const cTitle = await page.evaluate(() => {
    const h = document.querySelector('h1, h2');
    return h ? h.textContent.trim().substring(0, 80) : 'N/A';
  });
  const cPrice = text.match(/[0-9,]+원/g);
  console.log(`  [${cTitle}] 가격: ${cPrice ? cPrice[0] : 'N/A'}`);

  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 80)));
