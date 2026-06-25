// AICUT 블로그 이미지 5장 (교육/이러닝 주제)
const { makeImage } = require('./skills/image_gen');

(async () => {
  const images = [
    {
      theme: 'dark_green',
      badge: '📚 교육 콘텐츠',
      main: '온라인 강사·교육\n크리에이터라면\n<em>숏폼 마케팅</em>이\n필요한 이유',
      sub: '방학 특강 시즌, 지금이 기회입니다',
      cta: 'AICUT 무료상담 →',
      width: 700, height: 700,
      out: 'aicut_blog_edu_01_main.png'
    },
    {
      theme: 'dark_green',
      badge: '📈 교육 시장 트렌드',
      main: '온라인 교육 시장\n<em>영상 마케팅</em>이\n경쟁력이다',
      sub: '강의 퀄리티만큼 중요한 콘텐츠 홍보',
      cta: 'AICUT에 맡기세요',
      width: 800, height: 450,
      out: 'aicut_blog_edu_02_trend.png'
    },
    {
      theme: 'light_cyan',
      badge: '🎬 숏폼 마케팅',
      main: '숏폼 영상이\n강의 홍보에\n<em>효과적인 이유</em>',
      sub: '릴스·쇼츠·틱톡 알고리즘 활용법',
      cta: '전략 상담 받기',
      width: 800, height: 450,
      out: 'aicut_blog_edu_03_shortform.png'
    },
    {
      theme: 'dark_purple',
      badge: '🔥 방학 특강 시즌',
      main: '방학 특강 시즌\n<em>지금 준비</em>해야\n하는 이유',
      sub: '6월 말~7월 초가 골든타임입니다',
      cta: '지금 시작하세요',
      width: 800, height: 450,
      out: 'aicut_blog_edu_04_season.png'
    },
    {
      theme: 'light_pink',
      badge: '🎯 영상 편집 아웃소싱',
      main: '교육 콘텐츠 영상\n<em>AICUT</em>과\n함께하세요',
      sub: '월 정기 납품으로 안정적인 콘텐츠 발행',
      cta: '무료 상담 → master@aicut.co.kr',
      width: 800, height: 450,
      out: 'aicut_blog_edu_05_cta.png'
    }
  ];

  console.log('=== 교육 블로그 이미지 생성 시작 ===');
  for (let i = 0; i < images.length; i++) {
    console.log(`[${i + 1}/5] ${images[i].out}...`);
    const r = await makeImage(images[i]);
    console.log(`  ✅ ${r.file} (${r.sizeKB}KB)`);
  }
  console.log('=== 완료 ===');
})();
