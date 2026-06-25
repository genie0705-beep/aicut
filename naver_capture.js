const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const CAMPAIGN_ID = 'cmp-a001-01-000000010565267';

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[1];

  // 캠페인 페이지로 이동해서 실제 API 요청 캡처
  const captured = {};
  page.on('response', async (resp) => {
    const url = resp.url();
    if (!url.includes('/apis/sa/api/')) return;
    try {
      const body = await resp.text();
      const key = url.replace('https://ads.naver.com/apis/sa/api/', '').split('?')[0];
      if (!captured[key]) captured[key] = { url, body: body.substring(0, 3000) };
    } catch(e) {}
  });

  // 캠페인 상세 페이지 (광고그룹 리스트)
  await page.goto(`https://ads.naver.com/manage/ad-accounts/334739/sa/campaigns/${CAMPAIGN_ID}`, { waitUntil: 'networkidle', timeout: 20000 });
  await sleep(3000);

  console.log('캡처된 API:');
  for (const [key, val] of Object.entries(captured)) {
    console.log(`\n[${key}]`);
    console.log(val.url.substring(0, 120));
    console.log(val.body.substring(0, 500));
  }

  await b.close();
})().catch(e => console.error(e.message.split('\n')[0]));
