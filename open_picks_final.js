const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  const items = [
    { label: '🔥 아트뮤 GX410 150W PD3.1 EPR', url: 'https://www.coupang.com/vp/products/8915834419' },
    { label: '🔥 지파워 GaN PD150W 4구 67,900원', url: 'https://www.coupang.com/vp/products/9597652568' },
    { label: '🔌 노트킹 D-8 HP 변환젠더 3,900원', url: 'https://www.coupang.com/np/search?q=' + encodeURIComponent('노트킹 USB-C TO DC 4.5x3.0 100W D-8 HP 노트북 충전젠더') },
    { label: '🔌 컴스 IF975 HP 변환젠더 5,330원', url: 'https://www.coupang.com/np/search?q=' + encodeURIComponent('컴스 USB Type C 노트북 전원 변환젠더 IF975 HP 4.5') },
    { label: '🔌 에이치디탑 PD100W 4.5mm 케이블 6,930원', url: 'https://www.coupang.com/np/search?q=' + encodeURIComponent('에이치디탑 C타입 to DC PD100W 노트북 충전 케이블 4.5mm') },
    { label: '🔌 올리민 HP 변환젠더 7,500원', url: 'https://www.coupang.com/np/search?q=' + encodeURIComponent('올리민 USB3.1 C타입 PD to DC 변환 노트북 충전 젠더 HP') },
  ];

  for (const item of items) {
    await sleep(1000);
    const p = await ctx.newPage();
    await p.goto(item.url, { waitUntil: 'domcontentloaded' }).catch(() => {});
    console.log('✅ ' + item.label);
  }

  console.log('\n총 ' + items.length + '개 탭 열림');
  console.log('🔥 충전기 / 🔌 HP 변환케이블');
  console.log('각 탭에서 상품 클릭 → 리뷰 탭에서 "HP" "Victus" "게이밍" 검색해보세요');

  b.close();
})().catch(e => console.log('ERR:', e.message));
