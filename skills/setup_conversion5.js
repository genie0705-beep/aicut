const { chromium } = require('playwright');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();

  // ===== 1. aicut.co.kr 전환 포인트 분석 (domcontentloaded) =====
  console.log('=== 1. aicut.co.kr 사이트 분석 ===');
  const sitePage = await ctx.newPage();
  await sitePage.goto('https://aicut.co.kr', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await sleep(5000);
  
  const features = await sitePage.evaluate(() => {
    // 모든 링크와 버튼
    const all = document.querySelectorAll('a[href], button');
    const items = Array.from(all).map(el => ({
      text: (el.textContent || '').trim().slice(0, 30),
      href: el.href || '',
      tag: el.tagName
    }));
    
    // 연락처/상담 관련 찾기
    const contact = items.filter(i => 
      i.text.includes('문의') || i.text.includes('상담') || i.text.includes('신청') ||
      i.text.includes('시작') || i.text.includes('가입') || i.text.includes('견적') ||
      i.text.includes('연락') || i.text.includes('문자') || i.text.includes('카톡') ||
      i.href.includes('kakao') || i.href.includes('mailto') || i.text.includes('Contact')
    );
    
    // 폼 확인
    const forms = document.querySelectorAll('form').length;
    
    return { contact, forms, totalLinks: items.length };
  });
  console.log('사이트 전환 포인트:', JSON.stringify(features, null, 2));

  // ===== 2. GA4 이벤트 데이터 확인 =====
  console.log('\n=== 2. GA4 기존 이벤트 확인 ===');
  let gaPage = pages.find(p => p.url().includes('analytics.google.com'));
  if (!gaPage) {
    gaPage = await ctx.newPage();
  }
  await gaPage.bringToFront();
  
  // Realtime events report
  await gaPage.goto('https://analytics.google.com/analytics/web/#/p538910436/reports/realtime', {
    waitUntil: 'domcontentloaded', timeout: 20000
  }).catch(() => {});
  await sleep(8000);
  
  const realtime = await gaPage.evaluate(() => document.body.innerText.slice(0, 3000)).catch(() => 'N/A');
  console.log('Realtime:', realtime);

  // ===== 3. 네이버 전환추적 - searchad 직접 경로 =====
  console.log('\n=== 3. 네이버 전환추적 ===');
  const convPage = await ctx.newPage();
  await convPage.goto('https://manage.searchad.naver.com/conversion/index', {
    waitUntil: 'domcontentloaded', timeout: 20000
  }).catch(() => {});
  await sleep(5000);
  const convInfo = await convPage.evaluate(() => {
    return {
      url: window.location.href,
      title: document.title,
      body: document.body.innerText.slice(0, 2000)
    };
  }).catch(e => ({ error: e.message }));
  console.log(JSON.stringify(convInfo, null, 2));
  
  // Check if logged in
  if (convInfo.body && convInfo.body.includes('로그인')) {
    console.log('⚠️ searchad에 로그인 필요');
  }

  // ===== 4. 종합 상태 =====
  console.log('\n=== 4. 종합 리포트 ===');
  
  const summary = {
    ga4_site_installed: true,
    ga4_site_id: 'G-D141VGTF79',
    ga4_gtag_works: true,
    ga4_key_events_set: false, // need to check
    naver_conversion_tracking: 'not_found_url',
    site_contact_points: features?.contact?.length || 0,
    site_has_forms: features?.forms || 0,
    next_steps: [
      'GA4 → 주요 이벤트(Key Event)로 page_view 외 실제 전환 이벤트 설정 필요',
      'aicut.co.kr 웹사이트에 gtag 전환 이벤트 코드(문의하기 버튼 등) 추가 필요',
      '네이버 광고 전환추적 코드 생성 후 사이트에 설치 필요',
    ]
  };
  console.log(JSON.stringify(summary, null, 2));

  console.log('\n✅ 분석 완료');
})();
