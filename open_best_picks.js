const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  // 검색 결과 페이지로 열기 (상품 리스트에서 클릭해서 상세보기)
  const searches = [
    // 아트뮤 GX410 150W (PD3.1 EPR, Victus 150W 근접)
    { label: '🔥 아트뮤 GX410 150W PD3.1', q: '아트뮤 PD3.1 150W PPS GaN 접지 멀티 초고속 충전기 GX410' },
    // 지파워 PD150W (가성비 150W)
    { label: '🔥 지파워 GaN PD150W 67,900원', q: '지파워 GaN PD150W 4구 멀티형 노트북 충전기' },
    // 슬림큐 F240 (240W 게이밍 전용)
    { label: '🔥 슬림큐 F240 240W 게이밍 노트북 충전', q: '슬림큐 F240 240W GaN 게이밍노트북 충전기' },
    // HP 변환 - 노트킹 D-8 (4.5mm HP)
    { label: '🔌 노트킹 HP 변환젠더 4.5mm 3,900원', q: '노트킹 USB-C TO DC 4.5x3.0 100W D-8 HP 노트북 충전젠더' },
    // HP 변환 - 컴스 IF975
    { label: '🔌 컴스 IF975 HP 변환젠더 5,330원', q: '컴스 USB Type C 노트북 전원 변환젠더 IF975 HP' },
    // HP 변환 - 에이치디탑 케이블
    { label: '🔌 에이치디탑 HP 변환케이블 PD100W 6,930원', q: '에이치디탑 C타입 to DC PD100W 노트북 충전 케이블 4.5mm' },
    // HP 변환 - 올리민 젠더
    { label: '🔌 올리민 HP 변환젠더 7,500원', q: '올리민 USB3.1 C타입 PD to DC 변환 노트북 충전 젠더 HP' },
  ];

  // 기존 탭 정리 (쿠팡 탭만 남기고 새로 열기)
  // 새 탭으로 열기
  for (const s of searches) {
    await sleep(1200);
    const p = await ctx.newPage();
    await p.goto('https://www.coupang.com/np/search?q=' + encodeURIComponent(s.q), { waitUntil: 'domcontentloaded' }).catch(() => {});
  }

  console.log('✅ Victus 호환 최적 제품 7개 탭 열림');
  b.close();
})().catch(e => console.log('ERR:', e.message));
