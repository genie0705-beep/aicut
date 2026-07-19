const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log('=== 📊 GA4 마케팅 데이터 분석 ===\n');

  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  let page = ctx.pages().find(p => p.url().includes('analytics.google.com'));
  if (!page) {
    page = await ctx.newPage();
    await page.goto('https://analytics.google.com/analytics/web/#/p538910436', { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
    await sleep(5000);
  } else {
    await page.bringToFront();
    await sleep(3000);
  }

  // A. 홈 - 활성 사용자 등 주요 지표
  console.log('━━━ A. 홈 리포트 (28일) ━━━');
  await page.goto('https://analytics.google.com/analytics/web/#/p538910436/reports/intelligenthome', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await sleep(6000);

  const raw = await page.evaluate(() => document.body.innerText);
  // 키 숫자 주변 텍스트 스캔
  const lines = raw.split('\n').filter(l => l.trim());
  
  // 28일 데이터 영역 찾기
  const homeSection = raw.substring(0, 4000);
  console.log('  [Raw Home]');
  lines.slice(0, 40).forEach((l, i) => {
    if (l.trim()) console.log(`    ${i}: ${l.trim().substring(0, 100)}`);
  });

  // B. 트래픽 획득
  console.log('\n━━━ B. 트래픽 획득 (유입채널 / 7일) ━━━');
  await page.goto('https://analytics.google.com/analytics/web/#/p538910436/reports/trafficacquisition', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await sleep(7000);

  const rawTraffic = await page.evaluate(() => document.body.innerText);
  // 트래픽 획득 영역
  const tIdx = rawTraffic.indexOf('트래픽 획득');
  const trafficSection = tIdx >= 0 ? rawTraffic.substring(tIdx, tIdx + 3000) : rawTraffic.substring(0, 3000);
  console.log('  [Traffic Acquisition]');
  trafficSection.split('\n').filter(l => l.trim()).forEach(l => console.log('    ' + l.trim().substring(0, 120)));

  // C. 수동 캠페인
  console.log('\n━━━ C. 수동 캠페인 (30일) ━━━');
  await page.goto('https://analytics.google.com/analytics/web/#/p538910436/reports/campaigns', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await sleep(7000);

  const rawCam = await page.evaluate(() => document.body.innerText);
  const camSection = rawCam.substring(0, 3000);
  console.log('  [Campaigns]');
  camSection.split('\n').filter(l => l.trim()).forEach(l => console.log('    ' + l.trim().substring(0, 120)));

  // D. 이벤트
  console.log('\n━━━ D. 주요 이벤트 ━━━');
  await page.goto('https://analytics.google.com/analytics/web/#/p538910436/reports/engagement', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await sleep(7000);

  const rawEvent = await page.evaluate(() => document.body.innerText);
  const eventSection = rawEvent.substring(0, 3000);
  console.log('  [Events]');
  eventSection.split('\n').filter(l => l.trim()).forEach(l => console.log('    ' + l.trim().substring(0, 120)));

  console.log('\n' + '='.repeat(50));
  console.log('✅ 수집 완료');
  b.close();
})().catch(e => console.error('FATAL:', e.message));
