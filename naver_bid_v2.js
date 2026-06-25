const { chromium } = require('playwright');
const fs = require('fs');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const ADGROUP_ID = 'grp-a001-01-000000065663566';
const CUSTOMER_ID = '1800255';

// 조정 목록: CTR 높거나 고노출 저입찰 키워드
const ADJUSTMENTS = [
  // ★ CTR 높음 - 적극 투자
  { keyword: '릴스편집대행',   newBid: 1500 },
  { keyword: '광고영상편집',   newBid: 1500 },
  { keyword: '유튜브편집외주', newBid: 2000 },
  { keyword: '틱톡영상편집',   newBid: 1000 },
  // ★ 고노출 70원 → 순위 확보
  { keyword: '영상편집',      newBid: 400 },
  { keyword: '동영상편집',    newBid: 400 },
  { keyword: '유튜브편집',    newBid: 500 },
  { keyword: '영상편집프리랜서', newBid: 500 },
  { keyword: '릴스편집',      newBid: 500 },
  { keyword: '인스타릴스편집', newBid: 500 },
  { keyword: '영상콘텐츠제작', newBid: 300 },
  { keyword: '릴스제작',      newBid: 400 },
  { keyword: '릴스제작대행',  newBid: 500 },
];

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[1];

  // XSRF 토큰 갱신을 위해 페이지 로드
  let xsrfToken = null;
  page.on('request', req => {
    const h = req.headers();
    if (h['x-xsrf-token']) xsrfToken = h['x-xsrf-token'];
  });

  await page.goto(`https://ads.naver.com/manage/ad-accounts/334739/sa/campaigns/cmp-a001-01-000000010565267/adgroups/${ADGROUP_ID}/keywords`, { waitUntil: 'networkidle', timeout: 20000 });
  await sleep(2000);

  console.log('XSRF 토큰:', xsrfToken);

  // 키워드 목록 조회 (정확한 헤더로)
  const kwds = await page.evaluate(async ({ adgroupId, customerId }) => {
    const r = await fetch(`/apis/sa/api/ncc/keywords?nccAdgroupId=${adgroupId}&recordSize=200`, {
      credentials: 'same-origin',
      headers: {
        'Accept': 'application/json',
        'x-ad-customer-id': customerId,
      }
    });
    const text = await r.text();
    return { status: r.status, body: text };
  }, { adgroupId: ADGROUP_ID, customerId: CUSTOMER_ID });

  console.log('키워드 조회:', kwds.status, kwds.body.substring(0, 100));

  if (kwds.status !== 200) {
    // 다른 방법: 현재 페이지 렌더링 후 캡처된 요청에서 토큰 추출
    const netKwds = await page.evaluate(async ({ adgroupId }) => {
      // 앱에서 사용하는 방식 그대로 - Axios interceptor가 있을 수 있음
      if (window.axios) {
        const r = await window.axios.get(`/apis/sa/api/ncc/keywords?nccAdgroupId=${adgroupId}&recordSize=200`);
        return r.data;
      }
      return null;
    }, { adgroupId: ADGROUP_ID });
    console.log('Axios 결과:', netKwds ? JSON.stringify(netKwds).substring(0, 200) : 'null');
  }

  await b.close();
})().catch(e => console.error(e.message.split('\n')[0]));
