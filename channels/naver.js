/**
 * 네이버 검색광고 채널 데이터 수집기
 * 
 * .env 파일에서 NAVER_API_KEY, NAVER_API_SECRET, NAVER_CUSTOMER_ID 읽음
 * 인증 방식: HMAC-SHA256 (Secret Key는 UTF-8 문자열 그대로 HMAC에 사용)
 * Base URL: https://api.searchad.naver.com
 * 
 * 흐름:
 *   1. GET /ncc/campaigns → 캠페인 목록 조회
 *   2. GET /stats → 캠페인 통계 데이터 수집 (필수: id, fields)
 * 
 * 사용법: node channels/naver.js
 */

require('dotenv').config();
const crypto = require('crypto');
const store = require('../db/store');

store.init();

const NAVER_API_KEY = process.env.NAVER_API_KEY;
const NAVER_API_SECRET = process.env.NAVER_API_SECRET;
const NAVER_CUSTOMER_ID = process.env.NAVER_CUSTOMER_ID;
const BASE_URL = 'https://api.searchad.naver.com';

/* ================================================================
 * HMAC-SHA256 서명 생성
 * - Secret Key를 UTF-8 문자열 그대로 HMAC에 사용 (base64 디코딩 금지)
 * - 서명 메시지: {timestamp}.{METHOD}.{path}
 * - path는 쿼리스트링 제외
 * ================================================================ */
function generateSignature(method, path, timestamp) {
  const message = [timestamp, method, path].join('.');
  return crypto.createHmac('sha256', Buffer.from(NAVER_API_SECRET, 'utf-8'))
    .update(message)
    .digest('base64');
}

/* ================================================================
 * API 호출 (서명 자동 적용)
 * ================================================================ */
async function apiCall(method, path, params = {}) {
  const timestamp = Date.now().toString();
  const signature = generateSignature(method, path, timestamp);

  const url = new URL(BASE_URL + path);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const response = await fetch(url.toString(), {
    method,
    headers: {
      'X-Timestamp': timestamp,
      'X-API-KEY': NAVER_API_KEY,
      'X-Customer': NAVER_CUSTOMER_ID,
      'X-Signature': signature,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`HTTP ${response.status}: ${response.statusText} - ${body.substring(0, 200)}`);
  }

  return response.json();
}

/* ================================================================
 * 네이버 검색광고 데이터 수집
 * ================================================================ */
async function collectNaverData() {
  if (!NAVER_API_KEY || !NAVER_API_SECRET || !NAVER_CUSTOMER_ID) {
    console.warn('⚠️  네이버 API 키가 설정되지 않았습니다.');
    console.warn('   NAVER_API_KEY, NAVER_API_SECRET, NAVER_CUSTOMER_ID 가 .env 에 필요합니다.');
    console.warn('   → Mock 데이터를 생성합니다.\n');
    return generateMockData();
  }

  try {
    /* ---------- 1. 캠페인 목록 조회 ---------- */
    console.log('📋 캠페인 목록 조회 중...');
    const campaigns = await apiCall('GET', '/ncc/campaigns');
    console.log(`   → ${campaigns.length}개 캠페인 발견`);

    const activeCampaigns = campaigns.filter(c => c.status === 'ELIGIBLE' || c.status === 'PAUSED');
    if (activeCampaigns.length === 0) {
      throw new Error('ELIGIBLE 또는 PAUSED 상태의 캠페인이 없습니다.');
    }

    const campaign = activeCampaigns[0];
    const campaignId = campaign.nccCampaignId;
    console.log(`   → 대상 캠페인: ${campaign.name} (ID: ${campaignId}, 상태: ${campaign.status})`);

    /* ---------- 2. 통계 데이터 조회 ---------- */
    console.log('\n📊 통계 데이터 조회 중...');
    const stats = await apiCall('GET', '/stats', {
      id: campaignId,
      fields: JSON.stringify(['impCnt', 'clkCnt', 'ctr', 'cpc', 'salesAmt', 'convAmt', 'crto']),
      datePreset: 'last7days',
      timeIncrement: 'allDays'
    });

    const s = stats?.data?.[0] || {};
    console.log(`   → impCnt: ${s.impCnt}, clkCnt: ${s.clkCnt}, ctr: ${s.ctr}%, cpc: ${s.cpc}원`);
    console.log(`   → salesAmt: ${s.salesAmt}원, convAmt: ${s.convAmt}, crto: ${s.crto}%`);

    /* ---------- 3. store에 저장 (source=live) ---------- */
    const liveData = {
      // core metrics
      impressions: s.impCnt ?? 0,
      clicks: s.clkCnt ?? 0,
      ctr: s.ctr ?? 0,
      cpc: s.cpc ?? 0,
      total_cost: s.salesAmt ?? 0,
      conversion_rate: s.crto ?? 0,
      conv_amt: s.convAmt ?? 0,
      // campaign metadata
      campaign_id: campaignId,
      campaign_name: campaign.name,
      campaign_status: campaign.status,
      daily_budget: campaign.dailyBudget ?? 0
    };

    for (const [metric, value] of Object.entries(liveData)) {
      store.upsert('naver', metric, value, 'live', {
        collected_via: 'Naver Ads API',
        customer_id: NAVER_CUSTOMER_ID,
        campaign_id: campaignId
      });
    }

    console.log(`\n✅ 네이버 광고 데이터 수집 완료 (${Object.keys(liveData).length}개 항목, source=live)`);

    /* ---------- 4. (추가) 잔액 정보 조회 ---------- */
    try {
      console.log('\n💰 비즈머니 잔액 조회 중...');
      const bizmoney = await apiCall('GET', '/bizmoney');
      if (bizmoney) {
        const bizData = {
          bizmoney: bizmoney.remainMoney ?? bizmoney.totalMoney ?? 0,
          bizmoney_paid: bizmoney.paidMoney ?? 0,
          bizmoney_free: bizmoney.freeMoney ?? 0
        };
        for (const [metric, value] of Object.entries(bizData)) {
          store.upsert('naver', metric, value, 'live', {
            collected_via: 'Naver Ads API',
            note: 'bizmoney balance'
          });
        }
        console.log(`   → 비즈머니: ${bizData.bizmoney}원 (유상: ${bizData.bizmoney_paid}, 무상: ${bizData.bizmoney_free})`);
      }
    } catch (bizErr) {
      console.warn(`   ⚠️ 비즈머니 조회 실패: ${bizErr.message} (선택사항, 건너뜁니다)`);
    }

    return { ...liveData, meta: { campaigns_count: campaigns.length } };
  } catch (err) {
    console.error('❌ 네이버 API 호출 실패:', err.message);
    console.warn('   → Mock 데이터를 생성합니다.\n');
    return generateMockData();
  }
}

/* ================================================================
 * Mock 데이터 생성 (API 키 없거나 실패 시)
 * ================================================================ */
function generateMockData() {
  const mockData = {
    impressions: 1042,
    clicks: 15,
    ctr: 1.44,
    cpc: 1156,
    total_cost: 17343,
    daily_cost: 2477,
    conversions: 3,
    avg_bid: 3500,
    bizmoney: 99267,
    bizmoney_paid: 80731,
    bizmoney_free: 18536
  };

  for (const [metric, value] of Object.entries(mockData)) {
    store.upsert('naver', metric, value, 'mock', { note: 'mock data (no API key or API failed)' });
  }
  console.log(`✅ 네이버 Mock 데이터 저장 완료 (${Object.keys(mockData).length}개 항목, source=mock)`);
  return mockData;
}

/* ================================================================
 * 실행
 * ================================================================ */
if (require.main === module) {
  collectNaverData().then(() => {
    const syncAt = store.getLatestSyncAt('naver');
    console.log(`\n📅 마지막 동기화: ${syncAt}`);
    store.close();
  }).catch(err => {
    console.error('치명적 오류:', err);
    store.close();
    process.exit(1);
  });
}

module.exports = { collectNaverData };
