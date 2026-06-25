// AICUT 블로그 이미지 5장 (스타트업 주제)
const { makeImage } = require('./skills/image_gen');

(async () => {
  const images = [
    {
      theme: 'dark_purple',
      badge: '🚀 스타트업 마케팅',
      main: '스타트업이라면\n<em>IR 피칭 영상</em>\n전문 편집이 답인 이유',
      sub: 'AI 시대, 투자자 앞에서 차별화하세요',
      cta: 'AICUT 무료상담 →',
      width: 700, height: 700,
      out: 'aicut_blog_startup_01_main.png'
    },
    {
      theme: 'dark_purple',
      badge: '📈 IR 마케팅',
      main: 'IR 피칭 영상\n왜 <em>전문 편집</em>이\n필수인가',
      sub: '투자자의 3초를 잡아라',
      cta: 'IR 영상 문의',
      width: 800, height: 450,
      out: 'aicut_blog_startup_02_ir.png'
    },
    {
      theme: 'light_cyan',
      badge: '🤖 AI 시대',
      main: 'AI 시대\n<em>사람의 편집</em>이\n필요한 이유',
      sub: '생성형 AI로는 안 되는 것들',
      cta: 'AICUT 전략 상담',
      width: 800, height: 450,
      out: 'aicut_blog_startup_03_ai.png'
    },
    {
      theme: 'dark_green',
      badge: '📦 정기 납품',
      main: '스타트업 영상 마케팅\n<em>월 정기 납품</em>\n시스템',
      sub: '48시간 납기, 전담 에디터 배정',
      cta: '견적 문의하기',
      width: 800, height: 450,
      out: 'aicut_blog_startup_04_delivery.png'
    },
    {
      theme: 'light_pink',
      badge: '🎯 영상 편집 아웃소싱',
      main: '스타트업 영상 마케팅\n<em>AICUT</em>과 함께하세요',
      sub: 'IR 피칭부터 SNS 숏폼까지 한 번에',
      cta: '무료 상담 → master@aicut.co.kr',
      width: 800, height: 450,
      out: 'aicut_blog_startup_05_cta.png'
    }
  ];

  console.log('=== 스타트업 블로그 이미지 생성 시작 ===');
  for (let i = 0; i < images.length; i++) {
    console.log(`[${i + 1}/5] ${images[i].out}...`);
    const r = await makeImage(images[i]);
    console.log(`  ✅ ${r.file} (${r.sizeKB}KB)`);
  }
  console.log('=== 완료 ===');
})();
