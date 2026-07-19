const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

// 사이드바 메뉴에서 특정 텍스트를 가진 링크를 클릭하는 함수
async function clickSidebar(page, label) {
  try {
    // 사이드바 nav 링크 찾기
    const links = await page.$$('nav a, nav [role="button"], [data-side-nav] a, [role="navigation"] a');
    for (const link of links) {
      const text = await link.innerText().catch(() => '');
      if (text.includes(label)) {
        console.log(`  🔗 사이드바 "${label}" 클릭`);
        await link.click();
        await sleep(4000);
        return true;
      }
    }
    // fallback: 모든 a 태그 검색
    const allLinks = await page.$$('a');
    for (const link of allLinks) {
      const text = await link.innerText().catch(() => '');
      if (text.trim() === label || text.includes(label)) {
        console.log(`  🔗 fallback "${label}" 클릭`);
        await link.click();
        await sleep(4000);
        return true;
      }
    }
    console.log(`  ❌ "${label}" 링크를 찾을 수 없음`);
    return false;
  } catch(e) {
    console.log(`  ⚠️ "${label}" 클릭 오류: ${e.message.substring(0, 60)}`);
    return false;
  }
}

// 메인 보고서 영역 데이터 추출
async function extractTableData(page) {
  return await page.evaluate(() => {
    const text = document.body.innerText || '';
    // 주요 데이터 영역 (차트/테이블 부분)
    const lines = text.split('\n').filter(l => l.trim());
    
    // 특정 패턴 찾기: 숫자+문자 조합, 퍼센트, URL 패턴 등
    const result = [];
    let capture = false;
    let skipNav = true;
    
    for (const line of lines) {
      const t = line.trim();
      // 네비게이션/헤더 스킵
      if (t === '애널리틱스' || t === '홈' || t === '보고서' || t === '탐색' || 
          t === '광고' || t === '작업' || t === '관리' || t === '최근에 액세스함' ||
          t === '관리자' || t === '전환 관리' || t === '실시간 보기' ||
          t.startsWith('chevron') || t.startsWith('arrow_') || t === 'search' ||
          t === 'help' || t === 'arrow_drop_down' || t === 'close') {
        continue;
      }
      // 긴 sidebar 텍스트 스킵
      if (t.length > 80) continue;
      
      result.push(t);
    }
    return result;
  });
}

(async () => {
  console.log('=== 📊 GA4 실시간 분석 v4 (2026-07-15) ===\n');

  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  let page = ctx.pages().find(p => p.url().includes('analytics.google.com'));
  if (!page) {
    console.log('GA4 페이지 없음 → 새로 엽니다');
    page = await ctx.newPage();
    await page.goto('https://analytics.google.com/analytics/web/#/p538910436/reports/intelligenthome', { 
      waitUntil: 'domcontentloaded', timeout: 30000 
    }).catch(() => {});
    await sleep(8000);
  } else {
    await page.bringToFront();
    await sleep(3000);
  }

  // 홈 데이터 먼저 확인
  const homeData = await extractTableData(page);
  console.log('\n📌 [홈 리포트]');
  homeData.filter(l => !l.startsWith('이 카드') && !l.includes('사용') && l.length > 0).slice(0, 60).forEach(l => console.log(`  ${l}`));

  // --- 보고서 이동 ---
  // GA4는 SPA, 내부 링크 클릭으로 이동
  
  // 1. 트래픽 획득
  console.log('\n\n📌 [트래픽 획득]');
  await clickSidebar(page, '트래픽 획득');
  await sleep(5000);
  const trafficData = await extractTableData(page);
  trafficData.slice(0, 60).forEach(l => console.log(`  ${l}`));
  
  // 2. 캠페인
  console.log('\n\n📌 [캠페인]');
  await clickSidebar(page, '수동');
  await sleep(5000);
  const campData = await extractTableData(page);
  campData.slice(0, 60).forEach(l => console.log(`  ${l}`));

  // 3. 페이지 및 화면
  console.log('\n\n📌 [페이지 및 화면]');
  await clickSidebar(page, '페이지 및 화면');
  await sleep(5000);
  const pageData = await extractTableData(page);
  pageData.slice(0, 60).forEach(l => console.log(`  ${l}`));

  // 4. 이벤트
  console.log('\n\n📌 [이벤트]');
  await clickSidebar(page, '이벤트');
  await sleep(5000);
  const eventData = await extractTableData(page);
  eventData.slice(0, 60).forEach(l => console.log(`  ${l}`));

  // 5. 국가별
  console.log('\n\n📌 [국가별]');
  // 국가는 사용자 > 인구통계 > 국가
  await clickSidebar(page, '국가');
  await sleep(5000);
  const geoData = await extractTableData(page);
  geoData.slice(0, 40).forEach(l => console.log(`  ${l}`));

  console.log('\n' + '='.repeat(60));
  console.log('✅ GA4 분석 수집 완료');
  b.close().catch(() => {});
})().catch(e => {
  console.error('FATAL:', e.message, e.stack?.substring(0, 300));
  process.exit(1);
});
