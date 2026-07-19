const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  // 1. 아트뮤 GX410 150W (PD 3.1 EPR - Victus 호환 리뷰 확인)
  const p1 = await ctx.newPage();
  await p1.goto('https://www.coupang.com/vp/products/8594336446', { waitUntil: 'domcontentloaded' }).catch(() => {});
  console.log('1. 아트뮤 GX410 150W 열림');

  // 2. 아트뮤 GX310 150W (더 저렴한 대안)
  await sleep(1500);
  const p2 = await ctx.newPage();
  await p2.goto('https://www.coupang.com/vp/products/8594336446?productSet=1&searchId=', { waitUntil: 'domcontentloaded' }).catch(() => {});
  console.log('2. 아트뮤 150W 진행 중');

  // 3. HP 변환 - 컴스 IF975 (HP 4.5mm 스마트핀)
  await sleep(1500);
  const p3 = await ctx.newPage();
  await p3.goto('https://www.coupang.com/vp/products/7959234910', { waitUntil: 'domcontentloaded' }).catch(() => {});
  console.log('3. 컴스 IF975 변환젠더 열림');

  // 4. HP 변환 - 노트킹 USB-C to DC 4.5x3.0 100W
  await sleep(1500);
  const p4 = await ctx.newPage();
  await p4.goto('https://www.coupang.com/vp/products/6825677123', { waitUntil: 'domcontentloaded' }).catch(() => {});
  console.log('4. 노트킹 HP 변환젠더 열림');

  // 5. HP 변환 - 에이치디탑 C타입 to DC PD100W 4.5mm
  await sleep(1500);
  const p5 = await ctx.newPage();
  await p5.goto('https://www.coupang.com/vp/products/7920585508', { waitUntil: 'domcontentloaded' }).catch(() => {});
  console.log('5. 에이치디탑 변환케이블 열림');

  // 6. 슬림큐 F240 240W 게이밍 노트북 충전기 (Victus 호환 리뷰 확인)
  await sleep(1500);
  const p6 = await ctx.newPage();
  await p6.goto('https://www.coupang.com/np/search?q=%EC%8A%AC%EB%A6%BC%ED%81%90+F240+240W+GaN', { waitUntil: 'domcontentloaded' }).catch(() => {});
  console.log('6. 슬림큐 F240 검색 열림');

  console.log('\n✅ Victus 호환 확인용 탭 6개 열렸습니다');
  console.log('  각 상품 페이지에서 "HP Victus" 또는 "게이밍 노트북" 리뷰 검색해보세요');

  b.disconnect();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));
