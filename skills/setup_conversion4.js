const { chromium } = require('playwright');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();

  // ===== 1. aicut.co.kr 사이트 기능 분석 =====
  console.log('=== 1. aicut.co.kr 전환 포인트 분석 ===');
  const sitePage = await ctx.newPage();
  await sitePage.goto('https://aicut.co.kr', { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(3000);
  
  // 사이트 내 기능/링크 분석
  const siteFeatures = await sitePage.evaluate(() => {
    // 모든 링크, 버튼 찾기
    const allLinks = Array.from(document.querySelectorAll('a, button, [role="button"]'));
    const features = allLinks.map(el => ({
      text: (el.textContent || '').trim().slice(0, 40),
      href: el.href || '',
      tag: el.tagName,
      hasOnClick: !!el.getAttribute('onclick'),
      hasEventListener: el.getAttribute('data-event') || ''
    })).filter(f => f.text.length > 0);
    
    // Contact forms
    const forms = document.querySelectorAll('form');
    const formInfo = Array.from(forms).map(f => ({
      action: f.action,
      id: f.id,
      method: f.method,
      inputs: f.querySelectorAll('input, textarea, select').length
    }));
    
    // Check for gtag events
    const bodyText = document.body.innerText;
    const hasContact = bodyText.includes('문의') || bodyText.includes('상담') || bodyText.includes('견적');
    const hasPricing = bodyText.includes('요금') || bodyText.includes('가격') || bodyText.includes('가격');
    
    return {
      features: features.filter(f => f.text.includes('상담') || f.text.includes('문의') || f.text.includes('신청') || f.text.includes('가입') || f.text.includes('견적') || f.text.includes('시작') || f.href.includes('kakao') || f.href.includes('mailto')).slice(0, 20),
      forms: formInfo,
      hasContactSection: hasContact,
      hasPricing: hasPricing,
      pageLinks: features.filter(f => f.text.length > 2).slice(0, 50)
    };
  });
  console.log('사이트 기능:', JSON.stringify(siteFeatures, null, 2));

  // ===== 2. GA4 전환 이벤트 설정 =====
  console.log('\n=== 2. GA4 전환 이벤트 설정 ===');
  let gaPage = pages.find(p => p.url().includes('analytics.google.com'));
  if (!gaPage) {
    gaPage = await ctx.newPage();
  }
  await gaPage.bringToFront();
  
  // Navigate to GA4 admin → events
  await gaPage.goto('https://analytics.google.com/analytics/web/#/a227543683p538910436/admin/events/events', { 
    waitUntil: 'load', timeout: 30000 
  }).catch(() => {});
  await sleep(8000);
  
  console.log('GA4 events URL:', gaPage.url());
  const gaEventsText = await gaPage.evaluate(() => document.body.innerText.slice(0, 5000)).catch(() => 'N/A');
  console.log(gaEventsText);

  // Check what events exist
  // Try the engagement → events report instead
  await gaPage.goto('https://analytics.google.com/analytics/web/#/p538910436/reports/engagement', {
    waitUntil: 'load', timeout: 30000
  }).catch(() => {});
  await sleep(8000);
  const gaEventsText2 = await gaPage.evaluate(() => document.body.innerText.slice(0, 5000)).catch(() => 'N/A');
  console.log('\n=== Engagement Report ===');
  console.log(gaEventsText2);

  // ===== 3. 네이버 광고 전환추적 경로 찾기 =====
  console.log('\n=== 3. 네이버 광고 전환추적 경로 ===');
  let naverPage = pages.find(p => p.url().includes('ads.naver.com') || p.url().includes('searchad.naver.com'));
  if (!naverPage) {
    naverPage = await ctx.newPage();
    await naverPage.goto('https://ads.naver.com/manage/ad-accounts/334739/all-campaigns', { waitUntil: 'networkidle', timeout: 20000 });
    await sleep(3000);
  }
  await naverPage.bringToFront();
  
  // Try navigating via the tools menu
  await naverPage.goto('https://ads.naver.com/manage/ad-accounts/334739/tools', { 
    waitUntil: 'networkidle', timeout: 15000 
  }).catch(() => {});
  await sleep(3000);
  const toolsText = await naverPage.evaluate(() => document.body.innerText.slice(0, 2000));
  console.log('Tools page:', toolsText);
  
  // Try searchad.naver.com for conversion tracking
  await naverPage.goto('https://manage.searchad.naver.com/customer/334739/tools/conversion', {
    waitUntil: 'networkidle', timeout: 15000
  }).catch(() => {});
  await sleep(3000);
  const convText = await naverPage.evaluate(() => document.body.innerText.slice(0, 3000));
  console.log('SearchAd conversion:', convText);
  
  // Try old searchad path
  await naverPage.goto('https://manage.searchad.naver.com/conversion/index', {
    waitUntil: 'networkidle', timeout: 15000
  }).catch(() => {});
  await sleep(3000);
  const convText2 = await naverPage.evaluate(() => {
    return { url: window.location.href, body: document.body.innerText.slice(0, 3000) };
  });
  console.log('SearchAd conv2:', JSON.stringify(convText2));

  console.log('\n✅ 분석 완료');
})();
