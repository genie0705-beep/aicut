const { makeImage, THEMES } = require('./skills/image_gen.js');

async function main() {
  process.env.CDP_PORT = process.env.CDP_PORT || '9224';

  const images = [
    // 1. 대표 이미지 (700x700)
    {
      theme: 'light_cyan',
      badge: '🏢 분양 마케팅',
      main: '분양대행사\n하반기 마케팅\n<em>영상 콘텐츠</em>가\n답이다',
      sub: '숏폼 하나로 시작하는 하반기 분양 전략',
      cta: 'AICUT 무료상담 →',
      out: 'aicut_blog_estate_main.png',
      width: 700, height: 700
    },
    // 2. 섹션 카드 — 왜 영상인가 (600x338)
    {
      theme: 'dark_purple',
      badge: '🔍 분양 시장 트렌드',
      main: '영상 포함 페이지\n<em>체류 시간 2.5배</em> 증가',
      sub: '분양 정보 탐색, 이제 텍스트로는 부족하다',
      cta: 'AICUT 확인 →',
      out: 'aicut_blog_estate_card1.png',
      width: 600, height: 338
    },
    // 3. 섹션 카드 — 3가지 콘텐츠 유형 (600x338)
    {
      theme: 'dark_green',
      badge: '📋 분양 영상 3유형',
      main: '모델하우스 투어\n<em>분양 현장 숏폼</em>\n브랜디드 콘텐츠',
      sub: '유형별 전략으로 하반기 분양을 준비하라',
      cta: 'AICUT 자세히 →',
      out: 'aicut_blog_estate_card2.png',
      width: 600, height: 338
    },
    // 4. 섹션 카드 — 채널별 전략 (600x338)
    {
      theme: 'light_pink',
      badge: '📱 플랫폼 전략',
      main: '릴스·쇼츠·틱톡\n<em>채널별 최적화</em>가\n핵심이다',
      sub: '감성/정보/트렌드, 각 채널의 강점을 활용하라',
      cta: 'AICUT 문의 →',
      out: 'aicut_blog_estate_card3.png',
      width: 600, height: 338
    },
    // 5. 섹션 카드 — 아웃소싱 vs 인력 (600x338)
    {
      theme: 'dark_purple',
      badge: '💰 비용 비교',
      main: '인력 1명 월 인건비로\n<em>10~20편</em> 외주 제작',
      sub: '비용 효율성과 퀄리티, 아웃소싱이 답이다',
      cta: 'AICUT 견적 →',
      out: 'aicut_blog_estate_card4.png',
      width: 600, height: 338
    },
    // 6. CTA 카드 (600x338)
    {
      theme: 'light_cyan',
      badge: '🚀 지금 시작하세요',
      main: '하반기 분양<br>영상 마케팅\n<em>에이컷과 함께</em>',
      sub: '무료 상담 → 카톡 pf.kakao.com/_GIesX/chat',
      cta: 'AICUT 상담 신청',
      out: 'aicut_blog_estate_cta.png',
      width: 600, height: 338
    }
  ];

  console.log('=== 이미지 생성 시작 ===');
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    console.log(`[${i+1}/${images.length}] ${img.out}...`);
    try {
      const r = await makeImage(img);
      console.log(`  ✅ ${r.file} (${r.sizeKB}KB)`);
    } catch(e) {
      console.error(`  ❌ 실패: ${e.message}`);
    }
  }
  console.log('=== 완료 ===');
}

main().catch(e => console.error('❌ 전체 실패:', e));
