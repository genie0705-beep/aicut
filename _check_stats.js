const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  
  // Check existing tabs
  const contexts = browser.contexts();
  console.log(`Contexts: ${contexts.length}`);
  const pages = browser.contexts()[0]?.pages() || [];
  console.log(`Pages: ${pages.map(p => p.url()).join('\n')}`);

  // ======= 1. Search Advisor (서치어드바이저) =======
  console.log('\n=== OPENING SEARCH ADVISOR ===');
  const saPage = await browser.newPage();
  await saPage.goto('https://searchadvisor.naver.com/', { waitUntil: 'networkidle', timeout: 30000 });
  await saPage.waitForTimeout(3000);
  
  // Check Login State
  const saUrl = saPage.url();
  console.log(`SA URL: ${saUrl}`);
  
  if (saUrl.includes('nid.naver.com') || saUrl.includes('nidlogin')) {
    console.log('NAVER LOGIN REQUIRED - Need manual login');
    await saPage.screenshot({ path: 'searchadvisor_login.png', fullPage: false });
  } else {
    // Dashboard is loaded - try to find data
    await saPage.screenshot({ path: 'sa_dashboard.png', fullPage: false });
    
    // Try to navigate to blog stats
    await saPage.goto('https://searchadvisor.naver.com/console/site/statistics', { waitUntil: 'networkidle', timeout: 30000 });
    await saPage.waitForTimeout(3000);
    console.log(`SA Stats URL: ${saPage.url()}`);
    await saPage.screenshot({ path: 'sa_statistics.png', fullPage: false });
    
    // Get page content for analysis
    const content = await saPage.content();
    console.log(`SA Content length: ${content.length} chars`);
  }

  // ======= 2. Naver Ad Center (네이버 광고센터) =======
  console.log('\n=== OPENING NAVER AD CENTER ===');
  const adPage = await browser.newPage();
  await adPage.goto('https://manage.searchad.naver.com/', { waitUntil: 'networkidle', timeout: 30000 });
  await adPage.waitForTimeout(3000);
  
  const adUrl = adPage.url();
  console.log(`Ad URL: ${adUrl}`);
  
  if (adUrl.includes('nid.naver.com') || adUrl.includes('nidlogin')) {
    console.log('NAVER AD LOGIN REQUIRED');
    await adPage.screenshot({ path: 'naver_ad_login.png', fullPage: false });
  } else {
    await adPage.screenshot({ path: 'naver_ad_dash.png', fullPage: false });
    
    // Try to get campaign performance
    try {
      // Look for campaign list or dashboard data
      const dashText = await adPage.evaluate(() => document.body.innerText);
      console.log('Ad Text Preview:', dashText.substring(0, 2000));
    } catch (e) {
      console.log('Error reading ad content:', e.message);
    }
  }

  await browser.close();
  console.log('\n=== DONE ===');
})();
