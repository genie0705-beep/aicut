const { chromium } = require('playwright');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();

  // ===== 1. aicut.co.kr GA4 설치 확인 =====
  console.log('=== 1. aicut.co.kr GA4 태그 확인 ===');
  const sitePage = await ctx.newPage();
  await sitePage.goto('https://aicut.co.kr', { waitUntil: 'networkidle', timeout: 15000 });
  await sleep(3000);

  const ga4Check = await sitePage.evaluate(() => {
    // Check GA4 / gtag script
    const scripts = Array.from(document.querySelectorAll('script')).map(s => s.src || s.textContent.slice(0, 200));
    const gaRelated = scripts.filter(s => s.includes('gtag') || s.includes('google-analytics') || s.includes('ga4') || s.includes('G-'));
    const hasGTM = scripts.some(s => s.includes('googletagmanager'));
    const hasGA4 = scripts.some(s => s.includes('G-D141VGTF79') || s.includes('gtag'));
    
    // Check for window.ga or window.gtag
    const hasWindowGA = typeof window.ga !== 'undefined';
    const hasWindowGtag = typeof window.gtag !== 'undefined';
    const hasDataLayer = typeof window.dataLayer !== 'undefined';
    
    // Check meta tags
    const meta = Array.from(document.querySelectorAll('meta')).map(m => m.outerHTML).filter(m => m.includes('google'));
    
    return {
      hasGA4,
      hasGTM,
      hasWindowGA,
      hasWindowGtag,
      hasDataLayer,
      gaRelated,
      meta
    };
  });
  console.log('GA4 코드 설치 상태:', JSON.stringify(ga4Check, null, 2));

  // ===== 2. 네이버 광고 전환추적 섹션 확인 =====
  console.log('\n=== 2. 네이버 광고센터 전환추적 ===');
  let naverPage = pages.find(p => p.url().includes('ads.naver.com'));
  if (naverPage) {
    await naverPage.bringToFront();
    // 전환추적 페이지로 이동
    await naverPage.goto('https://ads.naver.com/manage/ad-accounts/334739/conversion', { waitUntil: 'networkidle', timeout: 15000 });
    await sleep(5000);
    
    const convData = await naverPage.evaluate(() => {
      return {
        url: window.location.href,
        bodyText: document.body.innerText.slice(0, 5000)
      };
    });
    console.log('URL:', convData.url);
    console.log('Body:', convData.bodyText);
  } else {
    console.log('네이버 광고 페이지 없음, 새로 접속');
    const p = await ctx.newPage();
    await p.goto('https://ads.naver.com/manage/ad-accounts/334739/conversion', { waitUntil: 'networkidle', timeout: 15000 });
    await sleep(5000);
    const convData = await p.evaluate(() => document.body.innerText.slice(0, 5000));
    console.log(convData);
  }

  // ===== 3. GA4 전환 이벤트 설정 확인 =====
  console.log('\n=== 3. GA4 주요 이벤트(Key Events) 설정 ===');
  let gaPage = pages.find(p => p.url().includes('analytics.google.com'));
  if (gaPage) {
    await gaPage.bringToFront();
    // Key events 페이지로 이동
    await gaPage.goto('https://analytics.google.com/analytics/web/#/a227543683p538910436/admin/events/events', { waitUntil: 'networkidle', timeout: 15000 });
    await sleep(5000);
    
    const gaEvents = await gaPage.evaluate(() => {
      return {
        url: window.location.href,
        bodyText: document.body.innerText.slice(0, 5000)
      };
    });
    console.log('URL:', gaEvents.url);
    console.log('Body:', gaEvents.bodyText);
  }

  console.log('\n✅ 확인 완료');
})();
