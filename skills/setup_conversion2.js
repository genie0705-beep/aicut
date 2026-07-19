const { chromium } = require('playwright');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();

  // ===== 1. aicut.co.kr GA4 설치 확인 =====
  console.log('=== 1. aicut.co.kr 사이트 분석 ===');
  const sitePage = await ctx.newPage();
  try {
    await sitePage.goto('https://aicut.co.kr', { waitUntil: 'load', timeout: 30000 });
    await sleep(5000);
  } catch(e) {
    console.log('⚠️ aicut.co.kr 로드 타임아웃 또는 실패:', e.message);
  }
  
  // URL 확인
  console.log('Current URL:', sitePage.url());
  
  const pageInfo = await sitePage.evaluate(() => {
    return {
      title: document.title,
      scripts: Array.from(document.querySelectorAll('script')).map(s => ({
        src: (s.src || '').slice(0, 100),
        text: (s.textContent || '').slice(0, 80)
      })).filter(s => s.src.includes('google') || s.src.includes('gtag') || s.text.includes('G-')),
      hasGTag: typeof window.gtag !== 'undefined',
      hasDataLayer: typeof window.dataLayer !== 'undefined',
      bodyPreview: document.body.innerText.slice(0, 200)
    };
  }).catch(e => ({ error: e.message }));
  console.log('사이트 정보:', JSON.stringify(pageInfo, null, 2));

  // ===== 2. 네이버 광고 전환추적 =====
  console.log('\n=== 2. 네이버 광고 전환추적 설정 ===');
  let naverPage = pages.find(p => p.url().includes('ads.naver.com'));
  if (!naverPage) {
    naverPage = await ctx.newPage();
    await naverPage.goto('https://ads.naver.com/manage/ad-accounts/334739/conversion', { waitUntil: 'networkidle', timeout: 20000 });
    await sleep(5000);
  } else {
    await naverPage.bringToFront();
    await naverPage.goto('https://ads.naver.com/manage/ad-accounts/334739/conversion', { waitUntil: 'networkidle', timeout: 20000 });
    await sleep(5000);
  }

  const naverConv = await naverPage.evaluate(() => {
    return {
      url: window.location.href,
      title: document.title,
      bodyText: document.body.innerText.slice(0, 5000)
    };
  });
  console.log(naverConv.bodyText);

  // ===== 3. GA4 이벤트 설정 =====
  console.log('\n=== 3. GA4 이벤트 설정 ===');
  let gaPage = pages.find(p => p.url().includes('analytics.google.com'));
  if (gaPage) {
    await gaPage.bringToFront();
    // Try going to events configuration page
    await gaPage.goto('https://analytics.google.com/analytics/web/#/a227543683p538910436/admin/events/events', { 
      waitUntil: 'networkidle', timeout: 20000 
    }).catch(e => console.log('GA4 page load issue:', e.message));
    await sleep(5000);
    
    const gaEvents = await gaPage.evaluate(() => {
      return {
        url: window.location.href,
        bodyText: document.body.innerText.slice(0, 8000)
      };
    }).catch(e => ({ error: e.message }));
    console.log('GA4 Events:', gaEvents.bodyText ? gaEvents.bodyText.slice(0, 4000) : 'N/A');
  }

  console.log('\n✅ 확인 완료');
})();
