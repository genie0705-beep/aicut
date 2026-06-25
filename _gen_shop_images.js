// AICUT 블로그 이미지 5장 (쇼핑몰/이커머스 주제)
const { makeImage } = require('./skills/image_gen');

(async () => {
  const images = [
    {
      // 대표 이미지 (700x700)
      theme: 'dark_purple',
      badge: '🛒 이커머스 마케팅',
      main: '쇼핑몰·스마트스토어\n<em>숏폼 마케팅</em>에\n주목해야 하는 이유',
      sub: '릴스 알고리즘 2026, 지금이 기회입니다',
      cta: 'AICUT 무료상담 →',
      width: 700, height: 700,
      out: 'aicut_blog_shop_01_main.png'
    },
    {
      // 본문 이미지 1 (800x450)
      theme: 'dark_purple',
      badge: '📱 릴스 알고리즘',
      main: '릴스 알고리즘 2026\n<em>조회수 폭발</em>시키는\n핵심 전략',
      sub: '숏폼 마케팅의 모든 것, 에이컷과 함께',
      cta: '전략 상담 받기',
      width: 800, height: 450,
      out: 'aicut_blog_shop_02_reels.png'
    },
    {
      // 본문 이미지 2 (800x450)
      theme: 'light_cyan',
      badge: '☀️ 썸머 세일',
      main: '썸머 세일 시즌\n<em>숏폼 커머스</em>로\n준비하세요',
      sub: 'C-커머스 시대, 영상이 매출을 결정한다',
      cta: '지금 준비 시작',
      width: 800, height: 450,
      out: 'aicut_blog_shop_03_summer.png'
    },
    {
      // 본문 이미지 3 (800x450)
      theme: 'dark_green',
      badge: '📦 정기 납품',
      main: '쇼핑몰 영상 마케팅\n<em>월 정기 납품</em>\n시스템',
      sub: '매일 영상 고민 끝, 에이컷에 맡기세요',
      cta: '견적 문의하기',
      width: 800, height: 450,
      out: 'aicut_blog_shop_04_delivery.png'
    },
    {
      // 본문 이미지 4 (800x450) - CTA
      theme: 'light_pink',
      badge: '🎯 영상 편집 아웃소싱',
      main: '쇼핑몰 숏폼 마케팅\n<em>AICUT</em>과 함께하세요',
      sub: '릴스·쇼츠·틱톡, 한 번에 해결',
      cta: '무료 상담 → master@aicut.co.kr',
      width: 800, height: 450,
      out: 'aicut_blog_shop_05_cta.png'
    }
  ];

  console.log('=== 쇼핑몰 블로그 이미지 생성 시작 ===');
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    console.log(`[${i + 1}/5] 생성 중: ${img.out} (${img.width}x${img.height})...`);
    const result = await makeImage(img);
    console.log(`  ✅ ${result.file} (${result.sizeKB}KB)`);
  }
  console.log('=== 전체 생성 완료 ===');
})();
