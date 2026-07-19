const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  // 각 검색어로 탭 열기
  const searches = [
    { label: '🟢 아트뮤 GX410 150W PD3.1 EPR (Victus 호환 리뷰 확인)', q: encodeURIComponent('아트뮤 GX410 150W PD3.1 GaN 접지 멀티 초고속 충전기') },
    { label: '🟢 아트뮤 GX310 150W (할인 68,140원)', q: encodeURIComponent('아트뮤 PD3.1 150W PPS GaN 접지 멀티 초고속 충전기 GX310') },
    { label: '🟡 지파워 GaN PD150W 4구 멀티 (67,900원)', q: encodeURIComponent('지파워 GaN PD150W 4구 멀티형 노트북 충전기') },
    { label: '🔵 컴스 IF975 HP 변환젠더 USB-C to DC 4.5mm (5,330원)', q: encodeURIComponent('컴스 USB Type C 노트북 전원 변환젠더 IF975 HP') },
    { label: '🔵 노트킹 HP 변환젠더 USB-C to DC 4.5x3.0 100W (3,900원)', q: encodeURIComponent('노트킹 USB-C TO DC 4.5x3.0 100W HP 노트북 충전젠더') },
    { label: '🔵 에이치디탑 C타입 to DC PD100W 4.5mm 케이블 (6,930원)', q: encodeURIComponent('에이치디탑 C타입 to DC PD100W 노트북 충전 케이블 4.5mm') },
    { label: '🔵 올리민 USB-C PD to DC HP 변환 젠더 4.5mm (7,500원)', q: encodeURIComponent('올리민 USB3.1 C타입 PD to DC 변환 노트북 충전 젠더 HP') },
  ];

  for (const s of searches) {
    await sleep(1000);
    const p = await ctx.newPage();
    await p.goto('https://www.coupang.com/np/search?q=' + s.q, { waitUntil: 'domcontentloaded' }).catch(() => {});
    console.log(`✅ ${s.label}`);
  }

  console.log(`\n🔥 총 ${searches.length}개 탭 열림`);
  console.log('🟢 = 충전기 / 🔵 = HP 변환케이블');
  console.log('각 상품 클릭해서 "HP Victus" 또는 "게이밍 노트북" 리뷰 확인해보세요');

  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));
