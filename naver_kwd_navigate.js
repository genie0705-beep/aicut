const { chromium } = require('playwright');
const fs = require('fs');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const ADGROUP_ID = 'grp-a001-01-000000065663566';
const CAMPAIGN_ID = 'cmp-a001-01-000000010565267';

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[1];

  const allCaptured = [];
  page.on('response', async (resp) => {
    const url = resp.url();
    if (!url.includes('/apis/sa/api/')) return;
    try {
      const body = await resp.text();
      allCaptured.push({ url, body });
    } catch(e) {}
  });

  // 캠페인 페이지에서 시작
  await page.goto(`https://ads.naver.com/manage/ad-accounts/334739/sa/campaigns/${CAMPAIGN_ID}`, { waitUntil: 'networkidle', timeout: 20000 });
  await sleep(3000);

  console.log('현재 URL:', page.url());

  // 광고그룹 이름 클릭 → 키워드 탭 진입
  const grpClicked = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a, [role="link"]'));
    const link = links.find(l => l.href?.includes('adgroup') || l.innerText?.includes('퀵스타트'));
    if (link) { link.click(); return link.href || link.innerText; }
    // 테이블 첫 행 클릭
    const rows = document.querySelectorAll('tbody tr, [role="row"]');
    if (rows[0]) { rows[0].click(); return 'first row'; }
    return null;
  });
  console.log('광고그룹 클릭:', grpClicked);
  await sleep(3000);
  console.log('이동 후 URL:', page.url());

  // 키워드 탭 클릭
  const tabClicked = await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('a, button, [role="tab"]'));
    const tab = tabs.find(t => t.innerText?.trim() === '키워드' || t.innerText?.includes('키워드'));
    if (tab) { tab.click(); return tab.innerText; }
    return null;
  });
  console.log('키워드 탭 클릭:', tabClicked);
  await sleep(4000);

  console.log('\n=== 캡처된 API (키워드 관련) ===');
  allCaptured.forEach(({ url, body }) => {
    if (url.includes('keyword') || url.includes('kwd') || url.includes('stats')) {
      console.log('\nURL:', url.substring(0, 120));
      console.log('Body:', body.substring(0, 2000));
    }
  });

  // 키워드 텍스트 파싱
  const pageText = await page.evaluate(() => document.body.innerText);
  const lines = pageText.split('\n').filter(l => l.trim().length > 2);
  console.log('\n=== 페이지 텍스트 (키워드 섹션) ===');
  console.log(lines.slice(0, 100).join('\n'));

  fs.writeFileSync('naver_kwd_all.json', JSON.stringify(allCaptured, null, 2));
  await b.close();
})().catch(e => console.error(e.message.split('\n')[0]));
