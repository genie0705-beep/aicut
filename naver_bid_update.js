const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const ADGROUP_ID = 'grp-a001-01-000000065663566';
const CUSTOMER_ID = '1800255';

const ADJUSTMENTS = [
  // CTR 높음 - 적극 투자
  { keyword: '릴스편집대행',   newBid: 1500 },
  { keyword: '광고영상편집',   newBid: 1500 },
  { keyword: '틱톡영상편집',   newBid: 1000 },
  // 고노출 70원 → 순위 확보
  { keyword: '영상편집',      newBid: 400 },
  { keyword: '동영상편집',    newBid: 400 },
  { keyword: '유튜브편집',    newBid: 500 },
  { keyword: '영상편집프리랜서', newBid: 500 },
  { keyword: '릴스편집',      newBid: 500 },
  { keyword: '인스타릴스편집', newBid: 500 },
  { keyword: '영상콘텐츠제작', newBid: 300 },
  { keyword: '릴스제작',      newBid: 400 },
  { keyword: '릴스제작대행',  newBid: 500 },
  // 낮은 입찰가 → 보완
  { keyword: '영상편집견적',   newBid: 700 },
  { keyword: '유튜브쇼츠편집', newBid: 500 },
  { keyword: '인스타그램영상편집', newBid: 500 },
];

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[1];

  await page.goto(`https://ads.naver.com/manage/ad-accounts/334739/sa/campaigns/cmp-a001-01-000000010565267/adgroups/${ADGROUP_ID}/keywords`, { waitUntil: 'networkidle', timeout: 20000 });
  await sleep(2000);

  // 키워드 목록 조회
  const kwdsRaw = await page.evaluate(async ({ adgroupId, customerId }) => {
    const r = await fetch(`/apis/sa/api/ncc/keywords?nccAdgroupId=${adgroupId}&recordSize=200`, {
      credentials: 'same-origin',
      headers: { 'Accept': 'application/json', 'x-ad-customer-id': customerId }
    });
    return r.json();
  }, { adgroupId: ADGROUP_ID, customerId: CUSTOMER_ID });

  console.log('키워드 수:', kwdsRaw.length);

  // 키워드명 → 객체 맵
  const kwdMap = {};
  kwdsRaw.forEach(k => { kwdMap[k.keyword] = k; });

  let updated = 0;
  let skipped = 0;

  for (const adj of ADJUSTMENTS) {
    const cur = kwdMap[adj.keyword];
    if (!cur) {
      console.log(`  ❓ 없음: ${adj.keyword}`);
      skipped++;
      continue;
    }
    if (cur.bidAmt >= adj.newBid) {
      console.log(`  ⏭ 이미 높음: ${adj.keyword} (${cur.bidAmt}원 >= ${adj.newBid}원)`);
      skipped++;
      continue;
    }

    console.log(`  수정: ${adj.keyword}  ${cur.bidAmt}원 → ${adj.newBid}원`);

    const res = await page.evaluate(async ({ id, adgroupId, customerId, bidAmt, keywordData }) => {
      const body = { ...keywordData, bidAmt, nccAdgroupId: adgroupId };
      const r = await fetch(`/apis/sa/api/ncc/keywords/${id}`, {
        method: 'PUT',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-ad-customer-id': customerId,
        },
        body: JSON.stringify(body)
      });
      const text = await r.text();
      return { status: r.status, body: text.substring(0, 200) };
    }, {
      id: cur.nccKeywordId,
      adgroupId: ADGROUP_ID,
      customerId: CUSTOMER_ID,
      bidAmt: adj.newBid,
      keywordData: {
        nccKeywordId: cur.nccKeywordId,
        keyword: cur.keyword,
        userLock: cur.userLock,
        inspectStatus: cur.inspectStatus,
      }
    });

    if (res.status === 200) {
      console.log(`    ✅ 성공`);
      updated++;
    } else {
      console.log(`    ❌ 실패 ${res.status}: ${res.body}`);
    }
    await sleep(200);
  }

  console.log(`\n완료: ✅ ${updated}개 수정, ⏭ ${skipped}개 스킵`);
  await b.close();
})().catch(e => console.error(e.message.split('\n')[0]));
