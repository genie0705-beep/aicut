const { chromium } = require('playwright');
const fs = require('fs');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const CAMPAIGN_ID = 'cmp-a001-01-000000010565267';
const ADGROUP_ID = 'grp-a001-01-000000065663566';

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[1];

  const captured = {};

  page.on('response', async (resp) => {
    const url = resp.url();
    if (!url.includes('/apis/sa/api/')) return;
    try {
      const body = await resp.text();
      const shortKey = url.replace('https://ads.naver.com/apis/sa/api/', '').substring(0, 60);
      captured[shortKey] = { url, body };
    } catch(e) {}
  });

  // 광고그룹 상세 페이지
  await page.goto(`https://ads.naver.com/manage/ad-accounts/334739/sa/campaigns/${CAMPAIGN_ID}/adgroups/${ADGROUP_ID}`, { waitUntil: 'networkidle', timeout: 20000 });
  await sleep(3000);

  console.log('=== 캡처된 API 응답 ===');
  for (const [key, val] of Object.entries(captured)) {
    console.log(`\n[${key}]`);
    console.log(val.body.substring(0, 800));
  }

  fs.writeFileSync('naver_captured.json', JSON.stringify(captured, null, 2));
  console.log('\n저장 완료: naver_captured.json');

  await b.close();
})().catch(e => console.error(e.message.split('\n')[0]));
