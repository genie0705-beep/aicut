// 📸 여름 시즌 업종별 체크리스트 이미지 5장 생성
const { makeImage } = require('./image_gen');

const images = [
  // 1. 대표 이미지 (700x700)
  {
    theme: 'dark_purple',
    badge: '☀️ 여름 시즌 마케팅',
    main: '업종별\n<em>영상 마케팅</em>\n체크리스트',
    sub: '병원 · 부동산 · 이커머스 · 프랜차이즈',
    cta: 'AICUT 무료상담 →',
    out: 'aicut_blog_summer_main.png',
    width: 700, height: 700
  },
  // 2. 병원/의원 (800x450)
  {
    theme: 'light_pink',
    badge: '🏥 병원·의원 마케팅',
    main: '여름 시즌\n<em>필수 영상</em> 5가지',
    sub: '원장 인터뷰 · 시술 비교 · 전후 숏폼\n시즌 패키지 · 고객 후기',
    cta: '영상 편집 문의 →',
    out: 'aicut_blog_summer_hospital.png',
    width: 800, height: 450
  },
  // 3. 부동산 (800x450)
  {
    theme: 'light_cyan',
    badge: '🏢 부동산 마케팅',
    main: '하계 분양 · 여름 이사\n<em>영상 마케팅</em> 체크리스트',
    sub: '매물 투어 · 모델하우스 숏폼\n분양 정보 · 입주민 후기 · 지역 인프라',
    cta: '월 정기 납품 문의 →',
    out: 'aicut_blog_summer_realestate.png',
    width: 800, height: 450
  },
  // 4. 이커머스/쇼핑몰 (800x450)
  {
    theme: 'dark_purple',
    badge: '🛒 이커머스 마케팅',
    main: '<em>썸머 세일</em>\n숏폼 마케팅 전략',
    sub: '상품 소개 · 티저 영상 · 라이브 클립\n사용법 꿀팁 · 고객 리뷰',
    cta: '대량 숏폼 제작 문의 →',
    out: 'aicut_blog_summer_ecommerce.png',
    width: 800, height: 450
  },
  // 5. 프랜차이즈/외식 (800x450)
  {
    theme: 'dark_green',
    badge: '🍽️ 프랜차이즈 마케팅',
    main: '여름 시즌 메뉴\n<em>영상 프로모션</em> 전략',
    sub: '신메뉴 티저 · 먹방 클로즈업\n시즌 프로모션 · 매장 분위기 · 가맹 홍보',
    cta: '시즌 영상 제작 문의 →',
    out: 'aicut_blog_summer_franchise.png',
    width: 800, height: 450
  }
];

(async () => {
  process.env.CDP_PORT = '9224';
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    console.log(`[${i + 1}/${images.length}] ${img.out} 생성 중...`);
    const r = await makeImage(img);
    console.log(`  ✅ ${r.file} (${r.sizeKB}KB)`);
  }
  console.log('\n🎉 모든 이미지 생성 완료!');
})();
