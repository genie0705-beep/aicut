const { chromium } = require('playwright');
const fs = require('fs');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const CAMPAIGN_ID = 'cmp-a001-01-000000010565267';
const ADGROUP_ID = 'grp-a001-01-000000065663566';

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[1];

  async function apiGet(url) {
    return page.evaluate(async (u) => {
      const r = await fetch(u, { credentials: 'include' });
      return r.text();
    }, url);
  }

  const BASE = 'https://ads.naver.com/apis/sa/api';

  // 1. 광고그룹 상세
  const adgroup = await apiGet(`${BASE}/ncc/adgroups/${ADGROUP_ID}`);
  console.log('=== 광고그룹 상세 ===');
  console.log(adgroup);

  // 2. 키워드 목록
  const kwds = await apiGet(`${BASE}/ncc/keywords?nccAdgroupId=${ADGROUP_ID}&recordSize=200`);
  console.log('\n=== 키워드 목록 ===');
  // 파싱해서 핵심만 출력
  try {
    const arr = JSON.parse(kwds);
    arr.forEach(k => {
      console.log(`[${k.userLock ? 'OFF' : 'ON'}] ${k.keyword} | 입찰가:${k.bidAmt}원 | 상태:${k.status}`);
    });
    console.log('총', arr.length, '개');
  } catch(e) {
    console.log(kwds.substring(0, 3000));
  }

  // 3. 소재 목록
  const ads = await apiGet(`${BASE}/ncc/ads?nccAdgroupId=${ADGROUP_ID}`);
  console.log('\n=== 소재 목록 ===');
  try {
    const arr = JSON.parse(ads);
    arr.forEach(a => {
      const title = a.ad?.headline || '';
      const desc = a.ad?.description || '';
      const url = a.ad?.pcChannelUrl || '';
      console.log(`[${a.userLock ? 'OFF' : 'ON'}] 제목:${title} / 설명:${desc.substring(0,30)} / URL:${url}`);
    });
  } catch(e) {
    console.log(ads.substring(0, 2000));
  }

  // 4. 키워드별 통계 (7일)
  const kStats = await apiGet(`${BASE}/stats?id=${ADGROUP_ID}&fields=clkCnt,impCnt,salesAmtMicros,ctr,cpc&datePreset=LAST_7_DAYS&timeUnit=DAY&groupBy=keyword`);
  console.log('\n=== 키워드별 통계 ===');
  console.log(kStats.substring(0, 5000));

  // 5. 일별 통계 상세
  const daily = await apiGet(`${BASE}/stats?id=${ADGROUP_ID}&fields=clkCnt,impCnt,salesAmtMicros,ctr,cpc&datePreset=LAST_7_DAYS&timeUnit=DAY`);
  console.log('\n=== 일별 통계 ===');
  console.log(daily);

  // 저장
  fs.writeFileSync('naver_detail.json', JSON.stringify({ adgroup, kwds: JSON.parse(kwds), ads: JSON.parse(ads) }, null, 2));
  console.log('\n저장 완료: naver_detail.json');

  await b.close();
})().catch(e => console.error(e.message.split('\n')[0]));
