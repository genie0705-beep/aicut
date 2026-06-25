const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const ADGROUP_ID = 'grp-a001-01-000000065663566';
const CUSTOMER_ID = '1800255';

const ADJUSTMENTS = [
  { keyword: '릴스편집대행',   newBid: 1500 },
  { keyword: '광고영상편집',   newBid: 1500 },
  { keyword: '틱톡영상편집',   newBid: 1000 },
  { keyword: '영상편집',      newBid: 400 },
  { keyword: '동영상편집',    newBid: 400 },
  { keyword: '유튜브편집',    newBid: 500 },
  { keyword: '영상편집프리랜서', newBid: 500 },
  { keyword: '릴스편집',      newBid: 500 },
  { keyword: '인스타릴스편집', newBid: 500 },
  { keyword: '영상콘텐츠제작', newBid: 300 },
  { keyword: '릴스제작',      newBid: 400 },
  { keyword: '릴스제작대행',  newBid: 500 },
  { keyword: '영상편집견적',   newBid: 700 },
  { keyword: '유튜브쇼츠편집', newBid: 500 },
  { keyword: '인스타그램영상편집', newBid: 500 },
];

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[1];

  // 실제 PUT 요청 관찰
  const putReqs = [];
  page.on('request', req => {
    if (req.method() === 'PUT' && req.url().includes('keywords')) {
      putReqs.push({ url: req.url(), body: req.postData(), headers: JSON.stringify(req.headers()).substring(0, 300) });
    }
  });

  // 키워드 페이지에서 페이지 로드
  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/campaigns/cmp-a001-01-000000010565267/adgroups/grp-a001-01-000000065663566', { waitUntil: 'networkidle', timeout: 25000 });
  await sleep(3000);

  console.log('현재 URL:', page.url());

  // 키워드 탭 존재 여부 확인
  const tabInfo = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('a, button, [role="tab"]'));
    return all.filter(el => el.innerText?.length < 20).map(el => ({
      text: el.innerText?.trim(),
      href: el.href?.substring(50),
      tag: el.tagName
    })).filter(el => el.text);
  });
  console.log('탭/버튼:', JSON.stringify(tabInfo.slice(0, 20)));

  // PUT API 직접 (fields 파라미터 추가)
  const kwdsRaw = await page.evaluate(async ({ adgroupId, customerId }) => {
    const r = await fetch(`/apis/sa/api/ncc/keywords?nccAdgroupId=${adgroupId}&recordSize=200`, {
      credentials: 'same-origin',
      headers: { 'Accept': 'application/json', 'x-ad-customer-id': customerId }
    });
    return r.json();
  }, { adgroupId: ADGROUP_ID, customerId: CUSTOMER_ID });

  if (!Array.isArray(kwdsRaw)) {
    console.log('키워드 조회 실패:', JSON.stringify(kwdsRaw));
    await b.close();
    return;
  }

  const kwdMap = {};
  kwdsRaw.forEach(k => { kwdMap[k.keyword] = k; });
  console.log('키워드 수:', kwdsRaw.length);

  let updated = 0;
  for (const adj of ADJUSTMENTS) {
    const cur = kwdMap[adj.keyword];
    if (!cur) { console.log(`❓ 없음: ${adj.keyword}`); continue; }
    if (cur.bidAmt >= adj.newBid) {
      console.log(`⏭ 스킵: ${adj.keyword} (현재 ${cur.bidAmt}원)`);
      continue;
    }

    console.log(`수정: ${adj.keyword}  ${cur.bidAmt}원 → ${adj.newBid}원`);

    // fields 쿼리 파라미터 포함
    const res = await page.evaluate(async ({ id, adgroupId, customerId, bidAmt, kw }) => {
      const payload = {
        nccKeywordId: kw.nccKeywordId,
        nccAdgroupId: kw.nccAdgroupId,
        keyword: kw.keyword,
        bidAmt: bidAmt,
        userLock: kw.userLock,
        delFlag: kw.delFlag || false,
      };
      const url = `/apis/sa/api/ncc/keywords/${id}?fields=bidAmt`;
      const r = await fetch(url, {
        method: 'PUT',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-ad-customer-id': customerId,
        },
        body: JSON.stringify(payload)
      });
      const text = await r.text();
      return { status: r.status, body: text.substring(0, 200) };
    }, { id: cur.nccKeywordId, adgroupId: ADGROUP_ID, customerId: CUSTOMER_ID, bidAmt: adj.newBid, kw: cur });

    if (res.status === 200) {
      console.log(`  ✅ 성공`);
      updated++;
    } else {
      console.log(`  ❌ ${res.status}: ${res.body}`);
    }
    await sleep(200);
  }

  console.log(`\n완료: ${updated}개 수정됨`);
  console.log('캡처된 PUT 요청:', putReqs.length);
  if (putReqs[0]) console.log('샘플:', putReqs[0].url, putReqs[0].body?.substring(0, 200));

  await b.close();
})().catch(e => console.error(e.message.split('\n')[0]));
