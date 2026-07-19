const { chromium } = require('playwright');
const CDP_PORT = 9224;

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  // 1. 150W PD 충전기 - 아트뮤
  const p1 = await ctx.newPage();
  await p1.goto('https://www.coupang.com/np/search?q=%EC%95%84%ED%8A%B8%EB%AE%A4+PD3.1+150W+GaN+GX410', { waitUntil: 'domcontentloaded' });

  // 2. 150W PD 충전기 - 지파워
  const p2 = await ctx.newPage();
  await p2.goto('https://www.coupang.com/np/search?q=%EC%A7%80%ED%8C%8C%EC%9B%8C+GaN+PD150W', { waitUntil: 'domcontentloaded' });

  // 3. HP 변환젠더 - 컴스 IF975
  const p3 = await ctx.newPage();
  await p3.goto('https://www.coupang.com/np/search?q=%EC%BB%B4%EC%8A%A4+USB-C+PD+to+DC+4.5+3.0+HP+IF975', { waitUntil: 'domcontentloaded' });

  // 4. HP 변환케이블 - GODA
  const p4 = await ctx.newPage();
  await p4.goto('https://www.coupang.com/np/search?q=GODA+PD+to+DC+%EB%85%B8%ED%8A%B8%EB%B6%81+%EC%B6%A9%EC%A0%84%EA%B8%B0+%EC%96%B4%EB%8C%91%ED%84%B0+%EC%BC%80%EC%9D%B4%EB%B8%94+HP%EC%A0%84%EC%9A%A9', { waitUntil: 'domcontentloaded' });

  // 5. 100W PD 충전기 - 레보엠 (가성비)
  const p5 = await ctx.newPage();
  await p5.goto('https://www.coupang.com/np/search?q=%EB%A0%88%EB%B3%B4%EC%97%A0+PD+GaN+100W+%EB%85%B8%ED%8A%B8%EB%B6%81+%EC%B6%A9%EC%A0%84%EA%B8%B0', { waitUntil: 'domcontentloaded' });

  console.log('✅ 5개 탭 열림');
  console.log('  1. 아트뮤 PD3.1 150W GaN GX410 (~82,700원)');
  console.log('  2. 지파워 GaN PD150W (~67,900원)');
  console.log('  3. 컴스 USB-C to DC HP 변환젠더 IF975 (~5,330원)');
  console.log('  4. GODA PD to DC HP 케이블 (~10,000원)');
  console.log('  5. 레보엠 PD GaN 100W (~26,430원 - 가성비)');

  b.disconnect();
})().catch(e => console.log('ERR:', e.message));
