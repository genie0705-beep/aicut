const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];
  page.on('dialog', async d => d.dismiss().catch(() => {}));

  // 1. 대시보드 전체 수치
  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/dashboard', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 4000));
  const dashboard = await page.evaluate(() => document.body.innerText.substring(0, 2000));
  console.log('=== 대시보드 ===');
  console.log(dashboard.substring(0, 1500));

  // 2. 전체 캠페인 목록
  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/campaigns', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 4000));
  const campaigns = await page.evaluate(() => document.body.innerText.substring(0, 3000));
  console.log('\n=== 캠페인 목록 ===');
  console.log(campaigns.substring(0, 2500));

  await b.close();
})().catch(e => console.error('ERR:', e.message));
