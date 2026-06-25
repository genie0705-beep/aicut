const { chromium } = require('playwright');
const fs = require('fs');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[1];

  // 현재 페이지의 네트워크 요청을 통해 API 엔드포인트 파악
  const responses = [];
  page.on('response', async (resp) => {
    const url = resp.url();
    if (url.includes('/api/') || url.includes('stats') || url.includes('keyword') || url.includes('campaign')) {
      try {
        const body = await resp.text();
        if (body.length > 50 && body.length < 50000) {
          responses.push({ url: url.substring(0, 100), body: body.substring(0, 500) });
        }
      } catch(e) {}
    }
  });

  // 파워링크 캠페인 URL로 직접 이동
  const acctId = '334739';
  await page.goto(`https://ads.naver.com/manage/ad-accounts/${acctId}/sa/powerlink`, { waitUntil: 'networkidle', timeout: 20000 });
  await sleep(3000);

  console.log('URL:', page.url());
  
  // 페이지 내 링크 확인
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[href]'))
      .map(a => a.href)
      .filter(h => h.includes('naver.com'))
      .slice(0, 20);
  });
  console.log('링크들:', links);

  // API 응답 출력
  console.log('\n캡처된 API 호출:', responses.length);
  responses.forEach(r => {
    console.log('URL:', r.url);
    console.log('Body:', r.body.substring(0, 200));
    console.log('---');
  });

  const txt = await page.evaluate(() => document.body.innerText.substring(0, 4000));
  console.log('\n페이지 텍스트:', txt.substring(0, 2000));

  await b.close();
})().catch(e => console.error(e.message.split('\n')[0]));
