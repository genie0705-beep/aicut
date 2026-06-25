const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  // Check Naver Analytics
  console.log('=== 네이버 애널리틱스 ===');
  await page.goto('https://analytics.naver.com/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  if (!page.url().includes('nidlogin')) {
    console.log('✅ 로그인됨');
    const text = await page.evaluate(() => document.body.innerText);
    console.log(text.substring(0, 3000));
    await page.screenshot({ path: 'na_analytics.png' });
    
    // Check if there's real-time data
    console.log('\n=== 실시간 분석 ===');
    await page.goto('https://analytics.naver.com/realtime', { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3000);
    console.log('URL:', page.url());
    
    const rtText = await page.evaluate(() => document.body.innerText);
    console.log(rtText.substring(0, 2000));
    await page.screenshot({ path: 'na_realtime.png' });
    
    // Check visitor analysis
    console.log('\n=== 방문분석 ===');
    await page.goto('https://analytics.naver.com/visitor', { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3000);
    console.log('URL:', page.url());
    const vText = await page.evaluate(() => document.body.innerText);
    console.log(vText.substring(0, 2000));
    await page.screenshot({ path: 'na_visitor.png' });
    
  } else {
    console.log('❌ 로그인 필요');
  }
  
  // Also check Search Advisor for aicut.co.kr data
  console.log('\n=== 서치어드바이저 (aicut.co.kr) ===');
  await page.goto('https://searchadvisor.naver.com/console/site/report/expose?site=https%3A%2F%2Faicut.co.kr', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  if (!page.url().includes('nidlogin')) {
    const saText = await page.evaluate(() => document.body.innerText);
    console.log(saText);
    await page.screenshot({ path: 'sa_data_after.png' });
  }
  
  await b.close();
})();
