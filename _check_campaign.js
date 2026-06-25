const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  // Navigate to campaign detail
  console.log('=== 캠페인 상세 ===');
  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/campaigns', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  let text = await page.evaluate(() => document.body.innerText);
  console.log(text.substring(0, 3000));
  
  // Try to find keyword details
  console.log('\n=== 광고그룹/키워드 ===');
  // Look for links that go to adgroup
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a')).filter(a => a.href.includes('adgroup')).map(a => a.href.substring(0, 150));
  });
  console.log('Ad group links:', links);
  
  await page.screenshot({ path: 'naver_campaign_detail.png' });
  
  // Also check keyword tool / report
  console.log('\n=== 보고서 ===');
  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/reports', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  text = await page.evaluate(() => document.body.innerText);
  console.log(text.substring(0, 2000));
  
  await page.screenshot({ path: 'naver_report.png' });
  
  await b.close();
})();
