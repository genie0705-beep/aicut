const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const PROP_ID = 'p538910436';

(async () => {
  console.log('=== 📊 GA4 실시간 분석 (2026-07-15) ===\n');

  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  let page = ctx.pages().find(p => p.url().includes('analytics.google.com'));
  if (!page) {
    console.log('GA4 페이지 없음 → 새로 엽니다');
    page = await ctx.newPage();
    await page.goto('https://analytics.google.com/', { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
    await sleep(8000);
  } else {
    await page.bringToFront();
    await sleep(3000);
  }

  // 현재 URL 확인
  const currentUrl = await page.evaluate(() => window.location.href);
  console.log('현재 URL:', currentUrl.substring(0, 100));

  async function gotoReport(url, label, waitMs = 8000) {
    console.log(`\n--- ${label} 로딩중...`);
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    } catch(e) {
      // 타임아웃 무시하고 계속
    }
    await sleep(waitMs);
    const text = await page.evaluate(() => document.body.innerText || '');
    return text;
  }

  // ==========================================
  // 1. 리얼타임
  // ==========================================
  const rt = await gotoReport(
    `https://analytics.google.com/analytics/web/#/${PROP_ID}/reports/realtime`,
    '1. 리얼타임',
    5000
  );
  const rtLines = rt.split('\n').filter(l => l.trim());
  console.log('\n[리얼타임]');
  rtLines.slice(0, 30).forEach((l, i) => console.log(`  ${i}: ${l.trim().substring(0, 90)}`));

  // ==========================================
  // 2. 홈 (28일)
  // ==========================================
  const home = await gotoReport(
    `https://analytics.google.com/analytics/web/#/${PROP_ID}/reports/intelligenthome`,
    '2. 홈 리포트 (28일)',
    8000
  );
  const homeLines = home.split('\n').filter(l => l.trim());
  console.log('\n[홈 리포트]');
  homeLines.slice(0, 50).forEach((l, i) => console.log(`  ${i}: ${l.trim().substring(0, 100)}`));

  // ==========================================
  // 3. 트래픽 획득
  // ==========================================
  const traffic = await gotoReport(
    `https://analytics.google.com/analytics/web/#/${PROP_ID}/reports/trafficacquisition`,
    '3. 트래픽 획득',
    8000
  );
  const trafficLines = traffic.split('\n').filter(l => l.trim());
  console.log('\n[트래픽 획득]');
  trafficLines.slice(0, 60).forEach((l, i) => console.log(`  ${i}: ${l.trim().substring(0, 120)}`));

  // ==========================================
  // 4. 캠페인
  // ==========================================
  const camp = await gotoReport(
    `https://analytics.google.com/analytics/web/#/${PROP_ID}/reports/campaigns`,
    '4. 캠페인',
    8000
  );
  const campLines = camp.split('\n').filter(l => l.trim());
  console.log('\n[캠페인]');
  campLines.slice(0, 50).forEach((l, i) => console.log(`  ${i}: ${l.trim().substring(0, 120)}`));

  // ==========================================
  // 5. 참여 > 페이지 및 화면
  // ==========================================
  const pages = await gotoReport(
    `https://analytics.google.com/analytics/web/#/${PROP_ID}/reports/pagesandscreens`,
    '5. 페이지 및 화면',
    8000
  );
  const pagesLines = pages.split('\n').filter(l => l.trim());
  console.log('\n[페이지]');
  pagesLines.slice(0, 50).forEach((l, i) => console.log(`  ${i}: ${l.trim().substring(0, 120)}`));

  // ==========================================
  // 6. 참여 > 이벤트
  // ==========================================
  const events = await gotoReport(
    `https://analytics.google.com/analytics/web/#/${PROP_ID}/reports/engagement`,
    '6. 이벤트',
    8000
  );
  const eventsLines = events.split('\n').filter(l => l.trim());
  console.log('\n[이벤트]');
  eventsLines.slice(0, 40).forEach((l, i) => console.log(`  ${i}: ${l.trim().substring(0, 120)}`));

  // ==========================================
  // 7. 사용자 > 인구통계 > 국가
  // ==========================================
  const geo = await gotoReport(
    `https://analytics.google.com/analytics/web/#/${PROP_ID}/reports/geo`,
    '7. 국가별',
    8000
  );
  const geoLines = geo.split('\n').filter(l => l.trim());
  console.log('\n[국가별]');
  geoLines.slice(0, 30).forEach((l, i) => console.log(`  ${i}: ${l.trim().substring(0, 100)}`));

  // ==========================================
  // 8. 전환 > 전환 이벤트
  // ==========================================
  const conv = await gotoReport(
    `https://analytics.google.com/analytics/web/#/${PROP_ID}/reports/conversions`,
    '8. 전환',
    8000
  );
  const convLines = conv.split('\n').filter(l => l.trim());
  console.log('\n[전환]');
  convLines.slice(0, 30).forEach((l, i) => console.log(`  ${i}: ${l.trim().substring(0, 100)}`));

  console.log('\n' + '='.repeat(60));
  console.log('✅ GA4 분석 수집 완료');
  await b.disconnect();
})().catch(e => {
  console.error('FATAL:', e.message, e.stack?.substring(0, 300));
  process.exit(1);
});
