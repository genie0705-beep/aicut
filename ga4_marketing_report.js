const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log('=== 📊 GA4 마케팅 데이터 분석 ===\n');

  // 1. Chrome 연결
  let b;
  try {
    b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  } catch(e) {
    console.log('❌ Chrome CDP 연결 실패:', e.message);
    process.exit(1);
  }

  const ctx = b.contexts()[0];

  // 2. GA4 페이지 열기 (기존 탭 찾기 or 새로 열기)
  let page = ctx.pages().find(p => p.url().includes('analytics.google.com'));
  if (!page) {
    console.log('📄 새 GA4 탭 열기...');
    page = await ctx.newPage();
    await page.goto('https://analytics.google.com/analytics/web/#/p538910436', { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
    await sleep(5000);
  } else {
    console.log('✅ 기존 GA4 탭 발견');
    await page.bringToFront();
    await sleep(3000);
  }

  console.log('   URL:', (await page.evaluate('location.href')).substring(0, 100));

  // 3. 로그인 확인
  const loginOk = await page.evaluate(() => !document.body.innerText.includes('로그인') || document.location.href.includes('analytics.google.com'));
  if (!loginOk) {
    console.log('❌ GA4 로그인 필요');
    await b.close();
    process.exit(1);
  }
  console.log('✅ GA4 로그인 상태\n');

  // ========================================
  // A. 홈 / 인사이트 데이터
  // ========================================
  console.log('━━━ A. 홈 리포트 ━━━');
  await page.goto('https://analytics.google.com/analytics/web/#/p538910436', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await sleep(5000);

  const homeData = await page.evaluate(() => {
    const text = document.body.innerText || '';
    const lines = text.split('\n').filter(l => l.trim());

    // 기간 정보
    const dates = text.match(/\d{4}년\s*\d{1,2}월\s*\d{1,2}일/g) || [];
    
    // 활성 사용자, 세션 등 숫자 데이터 찾기
    const result = { dates };

    const metrics = [
      { kw: '활성 사용자', key: 'activeUsers' },
      { kw: '사용자', key: 'users' },
      { kw: '세션', key: 'sessions' },
      { kw: '평균 참여 시간', key: 'avgEngagement' },
      { kw: '총 수익', key: 'revenue' },
      { kw: '전환', key: 'conversions' },
      { kw: '신규 사용자', key: 'newUsers' },
      { kw: '이벤트 수', key: 'events' },
      { kw: '조회수', key: 'pageviews' },
    ];

    for (const m of metrics) {
      const idx = text.indexOf(m.kw);
      if (idx >= 0) {
        const snippet = text.substring(Math.max(0, idx - 40), idx + 60).replace(/\n/g, ' ').trim();
        result[m.key] = snippet;
      }
    }

    result.rawLines = lines.slice(0, 50);
    return result;
  });

  console.log('📅 기간:', homeData.dates?.join(' ~ ') || '?');
  console.log('👤 활성 사용자:', homeData.activeUsers?.substring(0, 60) || '?');
  console.log('📊 세션:', homeData.sessions?.substring(0, 60) || '?');
  console.log('⏱ 평균 참여:', homeData.avgEngagement?.substring(0, 60) || '?');
  console.log('💰 수익:', homeData.revenue?.substring(0, 60) || '?');
  console.log('🔄 전환:', homeData.conversions?.substring(0, 60) || '?');

  // ========================================
  // B. 획득 보고서 (유입 채널)
  // ========================================
  console.log('\n━━━ B. 트래픽 획득 (유입 채널) ━━━');
  await page.goto('https://analytics.google.com/analytics/web/#/p538910436/reports/trafficacquisition', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await sleep(6000);

  const acqData = await page.evaluate(() => {
    const text = document.body.innerText || '';
    const result = {};

    // 채널별 데이터 추출
    const channels = [
      'Organic Search', 'Paid Search', 'Paid Shopping', 'Organic Shopping',
      'Paid Social', 'Organic Social', 'Direct', 'Referral', 'Email',
      'Display', 'Affiliates', 'Video', 'Cross-network', 'Unassigned',
      '(direct) / (none)', 'google / organic', 'naver / organic',
      '(social)', 'organic', 'direct', 'social', 'referral'
    ];

    for (const ch of channels) {
      const idx = text.indexOf(ch);
      if (idx >= 0) {
        // 채널명 주변 150자 스니펫
        result[ch] = text.substring(Math.max(0, idx - 20), Math.min(text.length, idx + 130)).replace(/\n/g, ' ').trim();
      }
    }

    result.rawPreview = text.substring(0, 2500);
    result.rawPreview2 = text.substring(2500, 5000);
    return result;
  });

  // 채널별 요약
  for (const [ch, snippet] of Object.entries(acqData)) {
    if (!ch.startsWith('raw')) {
      console.log(`  ${ch}: ${snippet.substring(0, 80)}`);
    }
  }

  // ========================================
  // C. 사용자 획득 (첫 방문 채널)
  // ========================================
  console.log('\n━━━ C. 사용자 획득 보고서 ━━━');
  await page.goto('https://analytics.google.com/analytics/web/#/p538910436/reports/useracquisition', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await sleep(6000);

  const uaData = await page.evaluate(() => {
    const text = document.body.innerText || '';
    const result = {};
    const channels = [
      'Organic Search', 'Paid Search', 'Paid Social', 'Organic Social',
      'Direct', 'Referral', 'Email', 'Display', 'Unassigned'
    ];
    for (const ch of channels) {
      const idx = text.indexOf(ch);
      if (idx >= 0) {
        result[ch] = text.substring(Math.max(0, idx - 20), Math.min(text.length, idx + 130)).replace(/\n/g, ' ').trim();
      }
    }
    result.preview = text.substring(0, 2000);
    return result;
  });

  for (const [ch, snippet] of Object.entries(uaData)) {
    if (ch !== 'preview') {
      console.log(`  ${ch}: ${snippet.substring(0, 80)}`);
    }
  }

  // ========================================
  // D. 전환 / 이벤트 데이터
  // ========================================
  console.log('\n━━━ D. 주요 이벤트 ━━━');
  await page.goto('https://analytics.google.com/analytics/web/#/p538910436/reports/engagement', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await sleep(6000);

  const eventData = await page.evaluate(() => {
    const text = document.body.innerText || '';
    const result = {};

    // 주요 이벤트 검색
    const events = [
      'generate_lead', 'page_view', 'session_start', 'scroll',
      'click', 'purchase', 'sign_up', 'begin_checkout',
      'form_submit', 'kakao_chat', 'email_click'
    ];

    for (const ev of events) {
      const idx = text.indexOf(ev);
      if (idx >= 0) {
        result[ev] = text.substring(Math.max(0, idx - 15), Math.min(text.length, idx + 80)).replace(/\n/g, ' ').trim();
      }
    }

    result.preview = text.substring(0, 2000);
    return result;
  });

  for (const [ev, snippet] of Object.entries(eventData)) {
    if (ev !== 'preview') {
      console.log(`  ${ev}: ${snippet.substring(0, 70)}`);
    }
  }

  // ========================================
  // E. 캠페인 / UTM 데이터
  // ========================================
  console.log('\n━━━ E. 캠페인 데이터 ━━━');

  // 캠페인 보고서로 이동
  await page.goto('https://analytics.google.com/analytics/web/#/p538910436/reports/campaigns', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await sleep(6000);

  const campaignData = await page.evaluate(() => {
    const text = document.body.innerText || '';
    const result = {};

    // 수동 캠페인 / UTM 검색
    const cams = ['ig', 'naver', 'instagram', 'threads', 'blog', 'aicut', 'utm_', 'campaign'];
    for (const c of cams) {
      const idx = text.toLowerCase().indexOf(c);
      if (idx >= 0) {
        const start = Math.max(0, idx - 50);
        const end = Math.min(text.length, idx + 100);
        result[c] = text.substring(start, end).replace(/\n/g, ' ').trim();
      }
    }

    result.preview = text.substring(0, 2000);
    result.rawLines = text.split('\n').filter(l => l.trim()).slice(0, 30);
    return result;
  });

  for (const [cam, snippet] of Object.entries(campaignData)) {
    if (cam !== 'preview' && cam !== 'rawLines') {
      console.log(`  ${cam}: ${snippet.substring(0, 70)}`);
    }
  }

  // ========================================
  // F. 리얼타임
  // ========================================
  console.log('\n━━━ F. 리얼타임 ━━━');
  await page.goto('https://analytics.google.com/analytics/web/#/p538910436/reports/realtime', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await sleep(5000);

  const rtData = await page.evaluate(() => {
    const text = document.body.innerText || '';
    return {
      nowPreview: text.substring(0, 1500),
      rawLines: text.split('\n').filter(l => l.trim()).slice(0, 20)
    };
  });

  console.log('  실시간 데이터 미리보기:');
  rtData.rawLines.slice(0, 10).forEach(l => console.log('    ' + l));

  // ========================================
  // 정리
  // ========================================
  console.log('\n' + '='.repeat(50));
  console.log('✅ GA4 데이터 수집 완료');
  console.log('='.repeat(50));

  b.disconnect();
  console.log('✅ Chrome 연결 해제 (브라우저 유지)');
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
