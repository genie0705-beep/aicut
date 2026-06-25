const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  console.log('=== 네이버 광고센터 접속 ===');
  await page.goto('https://manage.searchad.naver.com/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  const url = page.url();
  console.log('URL:', url);
  
  if (url.includes('nidlogin') || url.includes('nid.naver')) {
    console.log('❌ 로그인 필요 - Search Advisor로 확인');
    
    // Try Search Advisor instead for website data
    await page.goto('https://searchadvisor.naver.com/console/site/report/expose?site=https%3A%2F%2Faicut.co.kr', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    if (!page.url().includes('nidlogin')) {
      console.log('✅ Search Advisor 로그인됨');
      
      // Get all text data
      const text = await page.evaluate(() => document.body.innerText);
      console.log('\n=== Search Advisor 리포트 ===');
      console.log(text);
    }
  } else {
    console.log('✅ 광고센터 로그인됨!');
    
    // Get dashboard data
    const text = await page.evaluate(() => document.body.innerText);
    console.log('\n=== 광고센터 대시보드 ===');
    console.log(text.substring(0, 3000));
  }
  
  await page.screenshot({ path: 'naver_ad_status.png' });
  console.log('\nScreenshot saved');
  
  await b.close();
})();
