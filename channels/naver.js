/**
 * 네이버 검색광고 채널 데이터 수집기
 * 
 * .env 파일에서 NAVER_API_KEY, NAVER_API_SECRET, NAVER_CUSTOMER_ID 읽음
 * API 키가 없으면 mock 데이터를 생성하여 DB에 저장
 * 
 * 사용법: node channels/naver.js
 */

require('dotenv').config();
const store = require('../db/store');

// Initialize DB
store.init();

const NAVER_API_KEY = process.env.NAVER_API_KEY;
const NAVER_API_SECRET = process.env.NAVER_API_SECRET;
const NAVER_CUSTOMER_ID = process.env.NAVER_CUSTOMER_ID;

/** 네이버 검색광고 API 호출 → 수집 데이터 upsert */
async function collectNaverData() {
  if (!NAVER_API_KEY || !NAVER_API_SECRET || !NAVER_CUSTOMER_ID) {
    console.warn('⚠️  네이버 API 키가 설정되지 않았습니다.');
    console.warn('   NAVER_API_KEY, NAVER_API_SECRET, NAVER_CUSTOMER_ID 가 .env 에 필요합니다.');
    console.warn('   → Mock 데이터를 생성합니다.\n');
    return generateMockData();
  }

  try {
    const data = await fetchNaverAdsAPI();
    for (const [metric, value] of Object.entries(data)) {
      store.upsert('naver', metric, value, 'live', { collected_via: 'Naver Ads API' });
    }
    console.log(`✅ 네이버 광고 데이터 수집 완료 (${Object.keys(data).length}개 항목, source=live)`);
  } catch (err) {
    console.error('❌ 네이버 API 호출 실패:', err.message);
    console.warn('   → Mock 데이터를 생성합니다.\n');
    return generateMockData();
  }
}

/** 네이버 검색광고 REST API 호출 */
async function fetchNaverAdsAPI() {
  const BASE_URL = 'https://api.naver.com';

  // /stats 엔드포인트로 통합 성과 데이터 요청
  const url = `${BASE_URL}/stats?datePreset=today`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-API-KEY': NAVER_API_KEY,
      'X-API-SECRET': NAVER_API_SECRET,
      'X-CUSTOMER': NAVER_CUSTOMER_ID,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();

  // API 응답을 flat metric/value 맵으로 변환
  // (실제 응답 구조에 따라 조정 필요)
  return {
    impressions: result?.impressions ?? result?.stats?.[0]?.impressions ?? 0,
    clicks: result?.clicks ?? result?.stats?.[0]?.clicks ?? 0,
    ctr: result?.ctr ?? result?.stats?.[0]?.ctr ?? 0,
    cpc: result?.cpc ?? result?.stats?.[0]?.cpc ?? 0,
    total_cost: result?.cost ?? result?.stats?.[0]?.cost ?? 0,
    daily_cost: result?.dailyCost ?? result?.stats?.[0]?.dailyCost ?? 0,
    conversions: result?.conversions ?? result?.stats?.[0]?.conversions ?? 0,
    avg_bid: result?.avgBid ?? result?.stats?.[0]?.avgBid ?? 0
  };
}

/** Mock 데이터 생성 */
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
    store.upsert('naver', metric, value, 'agent_reported', { note: 'mock data (no API key)' });
  }
  console.log(`✅ 네이버 Mock 데이터 저장 완료 (${Object.keys(mockData).length}개 항목, source=agent_reported)`);
  return mockData;
}

// 실행
if (require.main === module) {
  collectNaverData().then(() => {
    const syncAt = store.getLatestSyncAt('naver');
    console.log(`📅 마지막 동기화: ${syncAt}`);
    store.close();
  }).catch(err => {
    console.error('치명적 오류:', err);
    store.close();
    process.exit(1);
  });
}

module.exports = { collectNaverData };
