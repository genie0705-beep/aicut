const { chromium } = require('playwright');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();

  // ===== 1. aicut.co.kr GA4 상태 상세 확인 =====
  console.log('=== 1. aicut.co.kr GA4 상세 ===');
  // Check the existing ga page or open new one
  let gaPage = pages.find(p => p.url().includes('analytics.google.com'));

  // Check if GA4 is firing events
  try {
    const gaInfo = await ctx.newPage().then(async p => {
      await p.goto('https://aicut.co.kr', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await sleep(3000);
      const info = await p.evaluate(() => {
        // Check gtag status
        const gaId = 'G-D141VGTF79';
        const hasScript = !!document.querySelector(`script[src*="${gaId}"]`);
        const gtagConfig = window.gtag;
        const dl = window.dataLayer || [];
        return {
          hasScript,
          hasGtag: typeof gtagConfig === 'function',
          dataLayerCount: dl.length,
          dataLayerPreview: dl.slice(0, 5)
        };
      });
      await p.close();
      return info;
    });
    console.log('GA4 설치 상태:', JSON.stringify(gaInfo, null, 2));
  } catch(e) {
    console.log('GA4 확인 실패:', e.message);
  }

  // ===== 2. 네이버 광고 - 전환추적 페이지 찾기 =====
  console.log('\n=== 2. 네이버 광고 전환추적 경로 탐색 ===');
  let naverPage = pages.find(p => p.url().includes('ads.naver.com'));
  if (!naverPage) {
    naverPage = await ctx.newPage();
    await naverPage.goto('https://ads.naver.com/manage/ad-accounts/334739/all-campaigns', { waitUntil: 'networkidle', timeout: 20000 });
    await sleep(3000);
  }
  await naverPage.bringToFront();
  await sleep(2000);

  // Try the conversion tracking URL
  const convUrls = [
    'https://ads.naver.com/manage/ad-accounts/334739/conversion/tracking',
    'https://ads.naver.com/manage/ad-accounts/334739/conversions',
    'https://ads.naver.com/manage/conversion',
    'https://manage.searchad.naver.com/conversion',
  ];
  
  for (const url of convUrls) {
    console.log(`Trying: ${url}`);
    await naverPage.goto(url, { waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
    await sleep(2000);
    const text = await naverPage.evaluate(() => document.body.innerText.slice(0, 300)).catch(() => '?');
    const url2 = naverPage.url();
    if (!text.includes('찾을 수 없') && !text.includes('404')) {
      console.log(`✅ Found! Body: ${text.slice(0, 200)}`);
      break;
    }
    console.log(`❌ Not found: ${text.slice(0, 80)}`);
  }

  // ===== 3. GA4 행동 보고서 =====
  console.log('\n=== 3. GA4 이벤트 데이터 ===');
  if (gaPage) {
    await gaPage.bringToFront();
    // Try reports → engagement → events
    await gaPage.goto('https://analytics.google.com/analytics/web/#/a227543683p538910436/engagement', { 
      waitUntil: 'load', timeout: 30000 
    }).catch(e => console.log('GA4 engage timeout:', e.message));
    await sleep(8000);
    
    const gaData = await gaPage.evaluate(() => {
      return {
        url: window.location.href,
        bodyText: document.body.innerText.slice(0, 8000)
      };
    }).catch(e => ({ error: e.message }));
    
    if (gaData.bodyText) console.log(gaData.bodyText.slice(0, 5000));
    else console.log('GA4 data:', JSON.stringify(gaData));
  }

  console.log('\n✅ 확인 완료');
})();
