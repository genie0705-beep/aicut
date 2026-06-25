const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const fs = require('fs');
const path = require('path');
const WORKSPACE = 'C:\\Users\\paul\\.openclaw\\workspace';

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  // 1. Check Naver Ad Center conversion tracking
  console.log('=== 전환 추적 설정 확인 ===');
  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/dashboard', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  
  // Try to navigate to conversion tracking
  // URL pattern: /manage/ad-accounts/{id}/tools/conversion
  const urls = [
    'https://ads.naver.com/manage/ad-accounts/334739/tools/conversion',
    'https://ads.naver.com/manage/ad-accounts/334739/conversion',
    'https://ads.naver.com/manage/ad-accounts/334739/tools',
  ];
  
  for (const url of urls) {
    console.log(`\nTrying: ${url.substring(0, 80)}`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
    
    const text = await page.evaluate(() => document.body.innerText);
    if (text.includes('전환') || text.includes('Conversion') || !text.includes('찾을 수 없습니다')) {
      console.log('✅ Found relevant page');
      console.log(text.substring(0, 1000));
      await page.screenshot({ path: `naver_tools_${urls.indexOf(url)}.png` });
      break;
    } else {
      console.log('❌ 404 or irrelevant');
    }
  }
  
  // 2. Also check Naver Search Console / Conversion settings
  // Try the old URL format
  console.log('\n=== 구버전 전환추적 ===');
  await page.goto('https://manage.searchad.naver.com/customer/tools/conversion', { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);
  
  const convText = await page.evaluate(() => document.body.innerText);
  console.log(convText.substring(0, 2000));
  await page.screenshot({ path: 'naver_old_conversion.png' });
  
  await b.close();
})();
