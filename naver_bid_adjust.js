const { chromium } = require('playwright');
const fs = require('fs');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// 조정할 키워드 목록 (ID, 새 입찰가)
// CTR 높은 것 올리기 + 고노출 70원짜리 올리기
const ADJUSTMENTS = [
  // CTR 높아서 투자가치 있음
  { id: 'nkw-a001-01-000008134109337', keyword: '릴스편집대행', newBid: 1500 },
  { id: 'nkw-a001-01-000008134109327', keyword: '광고영상편집', newBid: 1500 },
  { id: 'nkw-a001-01-000008123680368', keyword: '유튜브편집외주', newBid: 2000 },  // 이미 2000원일 수도
  { id: 'nkw-a001-01-000008141555518', keyword: '틱톡영상편집', newBid: 1000 },
  { id: 'nkw-a001-01-000008134109345', keyword: '유튜브편집비용', newBid: 1500 },  // 이미 1500원
  // 고노출 70원 → 올려서 순위 확보
  { id: 'nkw-a001-01-000008134094419', keyword: '영상편집', newBid: 400 },
  { id: 'nkw-a001-01-000008134094421', keyword: '유튜브편집', newBid: 500 },
  { id: 'nkw-a001-01-000008134094420', keyword: '동영상편집', newBid: 400 },
  { id: 'nkw-a001-01-000008123034089', keyword: '영상편집프리랜서', newBid: 500 },
  { id: 'nkw-a001-01-000008134094423', keyword: '유튜브영상편집', newBid: 500 },  // 이미 1500원
  { id: 'nkw-a001-01-000008134094426', keyword: '릴스편집', newBid: 500 },
  { id: 'nkw-a001-01-000008134109323', keyword: '인스타릴스편집', newBid: 500 },
];

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[1];

  // 현재 키워드 목록 먼저 확인 (ID → 현재 입찰가 매핑)
  const captured = {};
  page.on('response', async (resp) => {
    const url = resp.url();
    if (url.includes('ncc/keywords')) {
      try { captured.kwds = await resp.json(); } catch(e) {}
    }
  });

  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/campaigns/cmp-a001-01-000000010565267/adgroups/grp-a001-01-000000065663566/keywords', { waitUntil: 'networkidle', timeout: 20000 });
  await sleep(3000);

  // API로 직접 키워드 조회
  const kwds = await page.evaluate(async () => {
    const r = await fetch('https://ads.naver.com/apis/sa/api/ncc/keywords?nccAdgroupId=grp-a001-01-000000065663566&recordSize=200', { credentials: 'include' });
    return r.json();
  });

  console.log('키워드 수:', kwds.length || kwds.code);
  if (kwds.code) { console.log('에러:', JSON.stringify(kwds)); }

  if (Array.isArray(kwds)) {
    // ID → 현재 입찰가 맵
    const kwdMap = {};
    kwds.forEach(k => { kwdMap[k.nccKeywordId] = k; });

    let updated = 0;
    for (const adj of ADJUSTMENTS) {
      const cur = kwdMap[adj.id];
      if (!cur) { console.log('  ❌ 없음:', adj.keyword); continue; }
      if (cur.bidAmt === adj.newBid) { console.log('  ✅ 이미 설정됨:', adj.keyword, adj.newBid + '원'); continue; }

      console.log(`  수정 중: ${adj.keyword} ${cur.bidAmt}원 → ${adj.newBid}원`);

      const res = await page.evaluate(async ({ id, bidAmt, nccAdgroupId }) => {
        const r = await fetch(`https://ads.naver.com/apis/sa/api/ncc/keywords/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ bidAmt, nccAdgroupId })
        });
        return { status: r.status, body: await r.text() };
      }, { id: adj.id, bidAmt: adj.newBid, nccAdgroupId: 'grp-a001-01-000000065663566' });

      console.log(`    → ${res.status}: ${res.body.substring(0, 100)}`);
      if (res.status === 200) updated++;
      await sleep(300);
    }
    console.log(`\n✅ ${updated}개 입찰가 업데이트 완료`);
  }

  await b.close();
})().catch(e => console.error(e.message.split('\n')[0]));
