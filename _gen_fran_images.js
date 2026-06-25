// AICUT 블로그 이미지 5장 일괄 생성 (프랜차이즈 주제)
const { makeImage } = require('./skills/image_gen');

(async () => {
  const images = [
    {
      // 대표 이미지 (700x700)
      theme: 'dark_purple',
      badge: '🏪 프랜차이즈 마케팅',
      main: '프랜차이즈 본사라면\n<em>영상 마케팅</em>\n아웃소싱이 답인 이유',
      sub: '썸머 시즌, 가맹점 홍보의 핵심 전략',
      cta: 'AICUT 무료상담 →',
      width: 700, height: 700,
      out: 'aicut_blog_fran_01_main.png'
    },
    {
      // 본문 이미지 1 (800x450)
      theme: 'dark_purple',
      badge: '📈 프랜차이즈 마케팅',
      main: '프랜차이즈 마케팅\n왜 영상이 <em>필수</em>인가',
      sub: '창업 트렌드의 중심, 영상 콘텐츠',
      cta: 'AICUT에 맡기세요',
      width: 800, height: 450,
      out: 'aicut_blog_fran_02_why.png'
    },
    {
      // 본문 이미지 2 (800x450)
      theme: 'light_cyan',
      badge: '☀️ 썸머 시즌',
      main: '썸머 시즌 프로모션\n<em>숏폼 영상</em>으로 준비하세요',
      sub: '여름 메뉴·하계 프로모션, 영상이 답이다',
      cta: '지금 준비 시작',
      width: 800, height: 450,
      out: 'aicut_blog_fran_03_summer.png'
    },
    {
      // 본문 이미지 3 (800x450)
      theme: 'dark_green',
      badge: '📦 정기 납품',
      main: '가맹점 홍보 영상\n<em>월 정기 납품</em> 시스템',
      sub: '48시간 납기, 전담 에디터 배정',
      cta: '견적 문의하기',
      width: 800, height: 450,
      out: 'aicut_blog_fran_04_delivery.png'
    },
    {
      // 본문 이미지 4 (800x450) - CTA
      theme: 'light_pink',
      badge: '🎯 영상 편집 아웃소싱',
      main: '프랜차이즈 영상 마케팅\n<em>AICUT</em>과 함께하세요',
      sub: '본사는 운영에 집중, 영상은 에이컷에',
      cta: '무료 상담 → master@aicut.co.kr',
      width: 800, height: 450,
      out: 'aicut_blog_fran_05_cta.png'
    }
  ];

  console.log('=== 프랜차이즈 블로그 이미지 생성 시작 ===');
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    console.log(`[${i + 1}/5] 생성 중: ${img.out} (${img.width}x${img.height})...`);
    const result = await makeImage(img);
    console.log(`  ✅ ${result.file} (${result.sizeKB}KB)`);
  }
  console.log('=== 전체 생성 완료 ===');
})();
