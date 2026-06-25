const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// 단일 키워드 입찰가 수정 테스트
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[1];

  // 키워드 페이지 로드
  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/campaigns/cmp-a001-01-000000010565267/adgroups/grp-a001-01-000000065663566/keywords', { waitUntil: 'networkidle', timeout: 20000 });
  await sleep(3000);

  // PUT 요청 인터셉트 준비
  const putRequests = [];
  page.on('request', req => {
    if (req.method() === 'PUT' && req.url().includes('/apis/sa/api/')) {
      putRequests.push({ url: req.url(), body: req.postData() });
    }
  });
  page.on('response', async resp => {
    if (resp.request().method() === 'PUT' && resp.url().includes('/apis/sa/api/')) {
      try {
        const body = await resp.text();
        console.log('PUT 응답:', resp.url().substring(0, 80), body.substring(0, 200));
      } catch(e) {}
    }
  });

  // 키워드 행 더블클릭해서 입찰가 편집창 열기
  const clicked = await page.evaluate(() => {
    // 입찰가 셀 찾기
    const cells = Array.from(document.querySelectorAll('td, [role="cell"]'));
    const bidCell = cells.find(c => c.innerText?.trim() === '700' || c.innerText?.includes('700'));
    if (bidCell) { bidCell.click(); return '클릭: ' + bidCell.innerText; }
    return null;
  });
  console.log('셀 클릭:', clicked);
  await sleep(1000);

  // API 헤더 확인을 위해 현재 cookies/headers 추출
  const cookies = await ctx.cookies('https://ads.naver.com');
  console.log('쿠키 수:', cookies.length);
  const authCookie = cookies.find(c => c.name === 'NID_AUT' || c.name === 'NID_SES' || c.name.includes('auth'));
  console.log('인증 쿠키:', authCookie?.name, authCookie?.value?.substring(0, 20));

  // XHR로 직접 시도 (쿠키 자동 포함)
  const testResult = await page.evaluate(async () => {
    // CSRF 토큰 찾기
    const metas = document.querySelectorAll('meta');
    let csrf = null;
    for (const m of metas) {
      if (m.name === '_csrf' || m.httpEquiv === 'X-CSRF-TOKEN') {
        csrf = m.content;
      }
    }

    // 현재 페이지 URL
    const url = location.href;

    // 키워드 API 호출 테스트
    try {
      const r = await fetch('/apis/sa/api/ncc/keywords?nccAdgroupId=grp-a001-01-000000065663566&recordSize=5', {
        credentials: 'same-origin',
        headers: { 'Accept': 'application/json' }
      });
      const j = await r.json();
      return { ok: r.ok, status: r.status, count: Array.isArray(j) ? j.length : j };
    } catch(e) {
      return { error: e.message };
    }
  });
  console.log('API 테스트 결과:', JSON.stringify(testResult));

  await b.close();
})().catch(e => console.error(e.message.split('\n')[0]));
