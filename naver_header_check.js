const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[1];

  // 요청 헤더 캡처
  let capturedHeaders = null;
  page.on('request', req => {
    if (req.url().includes('/apis/sa/api/') && req.method() !== 'OPTIONS') {
      capturedHeaders = req.headers();
    }
  });

  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/campaigns/cmp-a001-01-000000010565267/adgroups/grp-a001-01-000000065663566/keywords', { waitUntil: 'networkidle', timeout: 20000 });
  await sleep(2000);

  console.log('캡처된 헤더:');
  if (capturedHeaders) {
    Object.entries(capturedHeaders).forEach(([k, v]) => {
      if (!['user-agent', 'accept-encoding', 'accept-language'].includes(k)) {
        console.log(`  ${k}: ${v.substring(0, 80)}`);
      }
    });
  }

  // page.evaluate에서 XMLHttpRequest 사용
  const result = await page.evaluate(async () => {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', '/apis/sa/api/ncc/keywords?nccAdgroupId=grp-a001-01-000000065663566&recordSize=5', true);
      xhr.withCredentials = true;
      xhr.onload = () => resolve({ status: xhr.status, resp: xhr.responseText.substring(0, 200) });
      xhr.onerror = () => resolve({ error: 'XHR error' });
      xhr.send();
    });
  });
  console.log('\nXHR 결과:', JSON.stringify(result));

  await b.close();
})().catch(e => console.error(e.message.split('\n')[0]));
