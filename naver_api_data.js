const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const CAMPAIGN_ID = 'cmp-a001-01-000000010565267';
const ACCT_NO = '334739';

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

  // 1. 광고그룹 목록
  const grps = await apiGet(`${BASE}/ncc/adgroups?nccCampaignId=${CAMPAIGN_ID}&recordSize=100`);
  console.log('=== 광고그룹 ===');
  console.log(grps.substring(0, 2000));

  // 2. 키워드 목록 (전체)
  const kwds = await apiGet(`${BASE}/ncc/keywords?nccCampaignId=${CAMPAIGN_ID}&recordSize=200`);
  console.log('\n=== 키워드 ===');
  console.log(kwds.substring(0, 8000));

  // 3. 통계 (캠페인 레벨, 7일)
  const stats = await apiGet(`${BASE}/stats?id=${CAMPAIGN_ID}&datePreset=LAST_7_DAYS&timeRange=DAILY&fields=clkCnt,viewCnt,salesAmtMicros,ctr,cpc,ccnt`);
  console.log('\n=== 통계 (7일) ===');
  console.log(stats.substring(0, 2000));

  // 4. 소재(광고) 목록
  const ads = await apiGet(`${BASE}/ncc/ads?nccCampaignId=${CAMPAIGN_ID}&recordSize=100`);
  console.log('\n=== 소재 ===');
  console.log(ads.substring(0, 3000));

  await b.close();
})().catch(e => console.error(e.message.split('\n')[0]));
