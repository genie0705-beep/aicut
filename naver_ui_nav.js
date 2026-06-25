const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[1];

  const putReqs = [];
  page.on('request', req => {
    if ((req.method() === 'PUT' || req.method() === 'PATCH') && req.url().includes('/apis/')) {
      putReqs.push({ method: req.method(), url: req.url(), body: req.postData() });
    }
  });

  // 1. 파워링크 메뉴 클릭
  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/channels', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await sleep(2000);

  // 파워링크 메뉴 클릭
  await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'));
    const pl = links.find(l => l.href?.includes('powerlink') || l.innerText?.trim() === '파워링크');
    if (pl) pl.click();
  });
  await sleep(2000);
  console.log('1. URL:', page.url());

  // 캠페인 이름 클릭
  await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a, span'));
    const camp = links.find(l => l.innerText?.includes('에이컷_영상편집_검색'));
    if (camp) camp.click();
  });
  await sleep(2000);
  console.log('2. URL:', page.url());

  // 광고그룹 클릭
  await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a, span, td'));
    const grp = links.find(l => l.innerText?.includes('퀵스타트_파워링크'));
    if (grp) grp.click();
  });
  await sleep(2000);
  console.log('3. URL:', page.url());

  const txt3 = await page.evaluate(() => document.body.innerText.substring(0, 500));
  console.log('페이지 내용:', txt3.substring(0, 200));

  // 키워드 탭 클릭
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('a, button, [role="tab"], li'));
    const kwd = tabs.find(t => t.innerText?.trim() === '키워드');
    if (kwd) kwd.click();
  });
  await sleep(2000);
  console.log('4. URL:', page.url());

  const txt4 = await page.evaluate(() => {
    const rows = document.querySelectorAll('tr, [role="row"]');
    return Array.from(rows).slice(0, 8).map(r => r.innerText?.substring(0, 120)).join('\n');
  });
  console.log('키워드 테이블:', txt4);

  // 첫 번째 키워드 행의 입찰가 셀 찾기
  const cellInfo = await page.evaluate(() => {
    const cells = Array.from(document.querySelectorAll('td'));
    return cells.slice(0, 30).map(c => ({
      text: c.innerText?.trim().substring(0, 30),
      class: c.className?.substring(0, 40),
      dataAttr: c.dataset ? Object.keys(c.dataset).join(',') : ''
    }));
  });
  console.log('셀 목록:', JSON.stringify(cellInfo.filter(c => c.text)));

  await b.close();
})().catch(e => console.error(e.message.split('\n')[0]));
