const { chromium } = require('playwright');
const fs = require('fs');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

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
      const shortKey = url.replace('https://ads.naver.com/apis/sa/api/', '').substring(0, 80);
      captured[shortKey] = { url, body };
    } catch(e) {}
  });

  // 키워드 탭 URL
  await page.goto(`https://ads.naver.com/manage/ad-accounts/334739/sa/campaigns/cmp-a001-01-000000010565267/adgroups/${ADGROUP_ID}/keywords`, { waitUntil: 'networkidle', timeout: 20000 });
  await sleep(4000);

  console.log('=== 키워드 페이지 API ===');
  for (const [key, val] of Object.entries(captured)) {
    if (key.includes('keyword') || key.includes('stats') || key.includes('kwd')) {
      console.log(`\n[${key}]`);
      console.log(val.url);
      console.log(val.body.substring(0, 1500));
    }
  }

  // 전체 저장
  fs.writeFileSync('naver_kwd_raw.json', JSON.stringify(captured, null, 2));
  console.log('\n전체 키:', Object.keys(captured).join('\n'));

  await b.close();
})().catch(e => console.error(e.message.split('\n')[0]));
