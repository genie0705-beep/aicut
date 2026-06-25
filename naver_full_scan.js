const { chromium } = require('playwright');
const fs = require('fs');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[1];

  const results = {};

  // 1. 파워링크 대시보드 (캠페인 통계)
  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/powerlink/campaigns', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await sleep(3000);
  results.campaigns = await page.evaluate(() => document.body.innerText.substring(0, 5000));

  // 2. 광고그룹
  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/powerlink/adgroups', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await sleep(3000);
  results.adgroups = await page.evaluate(() => document.body.innerText.substring(0, 5000));

  // 3. 키워드
  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/powerlink/keywords', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await sleep(3000);
  results.keywords = await page.evaluate(() => document.body.innerText.substring(0, 8000));

  // 4. 소재
  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/powerlink/ads', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await sleep(3000);
  results.ads = await page.evaluate(() => document.body.innerText.substring(0, 5000));

  fs.writeFileSync('naver_ads_data.json', JSON.stringify(results, null, 2));
  console.log('저장 완료: naver_ads_data.json');

  // 콘솔에도 출력
  console.log('\n=== 캠페인 ===');
  console.log(results.campaigns.substring(0, 1000));
  console.log('\n=== 광고그룹 ===');
  console.log(results.adgroups.substring(0, 1500));
  console.log('\n=== 키워드 ===');
  console.log(results.keywords.substring(0, 3000));
  console.log('\n=== 소재 ===');
  console.log(results.ads.substring(0, 1500));

  await b.close();
})().catch(e => console.error(e.message.split('\n')[0]));
