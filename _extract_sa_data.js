const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const page = await browser.newPage();
  
  // 1. Search Advisor Dashboard
  console.log('\n=== 1. 서치어드바이저 대시보드 ===');
  await page.goto('https://searchadvisor.naver.com/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'sa_dashboard.png', fullPage: true });
  
  // Get dashboard content
  let text = await page.evaluate(() => document.body.innerText);
  console.log('Dashboard text:', text.substring(0, 3000));
  
  // 2. Check site status / console
  console.log('\n=== 2. 사이트 통계 ===');
  await page.goto('https://searchadvisor.naver.com/console/site/statistics', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: 'sa_stats_page.png', fullPage: true });
  
  text = await page.evaluate(() => document.body.innerText);
  console.log('Stats page:', text.substring(0, 3000));
  
  // Check if there's a date range selector or data
  const html = await page.content();
  console.log('\nHTML snippet:', html.substring(5000, 7000));
  
  // 3. Check registered sites
  console.log('\n=== 3. 등록된 사이트 ===');
  await page.goto('https://searchadvisor.naver.com/console/site', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'sa_site_list.png', fullPage: true });
  
  text = await page.evaluate(() => document.body.innerText);
  console.log('Site list:', text.substring(0, 2000));
  
  // Check blog.naver.com/aicut registration
  await page.goto('https://searchadvisor.naver.com/console/site/request', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'sa_request.png', fullPage: true });
  text = await page.evaluate(() => document.body.innerText);
  console.log('Request page:', text.substring(0, 2000));
  
  await browser.close();
  console.log('\n=== DONE ===');
})();
