// 초복 날짜 2026 블로그 이미지 생성
const { makeTemplateImage } = require('./image_gen');

async function main() {
  const results = [];
  
  // 1️⃣ 대표 이미지 (700×700) — CTA 버튼 유지
  console.log('1️⃣ 대표 이미지 생성 중...');
  const r1 = await makeTemplateImage(
    'main',
    '🔥 2026 여름 마케팅',
    '초복 날짜 2026,\n하반기 영상 마케팅\n준비는 <em>지금부터</em>',
    '여름 시즌 FP·부동산·병원·프랜차이즈를 위한 영상 전략',
    'AICUT 무료상담 →',
    'aicut_blog_chobok_main.png'
  );
  results.push(r1);
  console.log(`  ✅ ${r1.file} (${r1.sizeKB}KB)`);

  // 2️⃣ 본문 카드 1 — CTA 버튼 없음, AICUT 문구 없음
  console.log('2️⃣ 카드 이미지 1 생성 중...');
  const r2 = await makeTemplateImage(
    'card',
    '☀️ 초복 날짜 정보',
    '2026년 초복은\n<em>7월 14일(화)</em>\n중복 24일, 말복 8월 13일',
    '올해 삼복 더위, 마케팅으로 준비하세요',
    '',
    'aicut_blog_chobok_card1.png'
  );
  results.push(r2);
  console.log(`  ✅ ${r2.file} (${r2.sizeKB}KB)`);

  // 3️⃣ 본문 카드 2
  console.log('3️⃣ 카드 이미지 2 생성 중...');
  const r3 = await makeTemplateImage(
    'card',
    '📋 업종별 전략',
    'FP·부동산·병원·프랜차이즈\n<em>여름 영상 마케팅</em>\n이렇게 준비하세요',
    '하반기 숏폼 마케팅, 지금 시작하세요',
    '',
    'aicut_blog_chobok_card2.png'
  );
  results.push(r3);
  console.log(`  ✅ ${r3.file} (${r3.sizeKB}KB)`);

  // 4️⃣ 본문 카드 3
  console.log('4️⃣ 카드 이미지 3 생성 중...');
  const r4 = await makeTemplateImage(
    'cardDark',
    '🎯 하반기 전략',
    '7월부터 준비하는\n<em>하반기 영상 마케팅</em>\n3가지 핵심 포인트',
    '정기 납품 + 숏폼 위주 + 데이터 기반',
    '',
    'aicut_blog_chobok_card3.png'
  );
  results.push(r4);
  console.log(`  ✅ ${r4.file} (${r4.sizeKB}KB)`);

  // 5️⃣ CTA 카드
  console.log('5️⃣ CTA 이미지 생성 중...');
  const r5 = await makeTemplateImage(
    'ctaCard',
    '💬 지금 상담하세요',
    '영상 편집 아웃소싱,\n<em>에이컷</em>에 맡기고\n본업에 집중하세요',
    '월 정기 납품 · 숏폼 전문 · 업종별 맞춤',
    '카카오톡 무료상담 →',
    'aicut_blog_chobok_cta.png'
  );
  results.push(r5);
  console.log(`  ✅ ${r5.file} (${r5.sizeKB}KB)`);

  console.log('\n✅ 전체 이미지 생성 완료');
  results.forEach(r => console.log(`  - ${r.file} (${r.sizeKB}KB)`));
}

main().catch(e => console.error('❌', e.message));
