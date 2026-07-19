const { chromium } = require('playwright');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();

  // ===== 네이버 광고 =====
  let naverPage = pages.find(p => p.url().includes('ads.naver.com') || p.url().includes('searchad.naver.com'));
  if (!naverPage) {
    naverPage = await ctx.newPage();
    await naverPage.goto('https://ads.naver.com/manage/ad-accounts/334739/all-campaigns', { waitUntil: 'networkidle', timeout: 20000 });
    await sleep(3000);
  }
  
  console.log('=== 📊 네이버 광고 현황 ===');
  await naverPage.bringToFront();
  await sleep(3000);

  // 전체 페이지 텍스트 수집
  let naverData = await naverPage.evaluate(() => {
    return {
      url: window.location.href,
      title: document.title,
      bodyText: document.body.innerText.slice(0, 10000)
    };
  });
  console.log('URL:', naverData.url);
  console.log('Title:', naverData.title);
  console.log('Body:', naverData.bodyText);

  // ===== 구글 애널리틱스 =====
  let gaPage = pages.find(p => p.url().includes('analytics.google.com'));
  if (!gaPage) {
    gaPage = await ctx.newPage();
    await gaPage.goto('https://analytics.google.com/analytics/web/#/a227543683p538910436', { waitUntil: 'networkidle', timeout: 20000 });
    await sleep(5000);
  }

  console.log('\n\n=== 📈 구글 애널리틱스 현황 ===');
  await gaPage.bringToFront();
  await sleep(5000);

  // GA4 페이지 정보 수집
  let gaData = await gaPage.evaluate(() => {
    return {
      url: window.location.href,
      title: document.title,
      bodyText: document.body.innerText.slice(0, 10000)
    };
  }).catch(e => ({ error: e.message }));
  console.log('URL:', gaData.url);
  console.log('Title:', gaData.title);
  console.log('Body:', JSON.stringify(gaData.bodyText ? gaData.bodyText.slice(0, 8000) : 'N/A'));

  // GA4: Try to check if we need to navigate to specific reports
  // Try going to the engagement overview
  console.log('\n\n=== GA4 - Engagement Report ===');
  await gaPage.goto('https://analytics.google.com/analytics/web/#/a227543683p538910436/engagement', { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await sleep(5000);
  const engagementData = await gaPage.evaluate(() => document.body.innerText.slice(0, 8000)).catch(() => 'N/A');
  console.log(engagementData);

  // GA4: Conversions report
  console.log('\n\n=== GA4 - Conversions Report ===');
  await gaPage.goto('https://analytics.google.com/analytics/web/#/a227543683p538910436/conversions', { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await sleep(5000);
  const convData = await gaPage.evaluate(() => document.body.innerText.slice(0, 8000)).catch(() => 'N/A');
  console.log(convData);

  // GA4: Acquisition overview
  console.log('\n\n=== GA4 - Acquisition Report ===');
  await gaPage.goto('https://analytics.google.com/analytics/web/#/a227543683p538910436/acquisition', { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await sleep(5000);
  const acqData = await gaPage.evaluate(() => document.body.innerText.slice(0, 8000)).catch(() => 'N/A');
  console.log(acqData);

  // All done
  console.log('\n✅ 데이터 수집 완료');
})();
