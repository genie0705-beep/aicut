const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[1];

  // 캠페인 클릭해서 광고그룹/키워드 들어가기
  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/channels', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await sleep(3000);

  // 캠페인 이름 클릭
  const clicked = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a, [role="link"], td'));
    const target = links.find(el => el.innerText?.includes('에이컷_영상편집_검색'));
    if (target) { target.click(); return true; }
    return false;
  });
  console.log('캠페인 클릭:', clicked);
  await sleep(3000);

  console.log('URL 이동:', page.url());
  const txt = await page.evaluate(() => document.body.innerText.substring(0, 8000));
  console.log(txt);

  await b.close();
})().catch(e => console.error(e.message.split('\n')[0]));
