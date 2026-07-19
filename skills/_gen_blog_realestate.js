// 부동산 중개사무소 블로그 이미지 생성
const { makeTemplateImage } = require('./image_gen.js');

const CDP_PORT = '9224';
process.env.CDP_PORT = CDP_PORT;

const outDir = __dirname + '/..';

async function main() {
  const IMAGES = [
    // 1. 대표 이미지 (700×700, dark_purple) — CTA 유지
    {
      tpl: 'main',
      badge: '🏢 부동산 마케팅',
      main: '부동산 중개사무소\n매물 영상 하나로\n<em>계약률</em>이 달라집니다',
      sub: '숏폼 영상 마케팅, 지금 시작하세요',
      cta: 'AICUT 무료상담 →',
      out: 'aicut_blog_realestate_main.png'
    },
    // 2. 본문 카드 (600×338, light_warm) — CTA 제거
    {
      tpl: 'card',
      badge: '🏢 부동산 마케팅',
      main: '왜 지금\n<em>영상 마케팅</em>인가?',
      sub: '매물 영상, 조회수 = 계약률',
      cta: '',
      out: 'aicut_blog_realestate_card1.png'
    },
    // 3. 본문 카드 (600×338, dark_purple) — CTA 제거
    {
      tpl: 'cardDark',
      badge: '📱 숏폼 전략',
      main: '릴스·쇼츠 하나로\n<em>문의량 3배</em>',
      sub: '숏폼 마케팅, 선택 아닌 필수',
      cta: '',
      out: 'aicut_blog_realestate_card2.png'
    },
    // 4. 본문 카드 (600×338, light_warm) — CTA 제거
    {
      tpl: 'card',
      badge: '🏗️ 분양 마케팅',
      main: '하반기 분양 시즌\n<em>영상</em>으로 준비하세요',
      sub: '모델하우스·단지 영상, 편집은 에이컷에',
      cta: '',
      out: 'aicut_blog_realestate_card3.png'
    },
    // 5. CTA 카드 (600×338, dark_green) — CTA 제거
    {
      tpl: 'ctaCard',
      badge: '✨ 에이컷',
      main: '지금 상담받고\n<em>무료 견적</em> 받으세요',
      sub: '월 정기 납품, 합리적인 가격',
      cta: '',
      out: 'aicut_blog_realestate_cta.png'
    }
  ];

  for (const img of IMAGES) {
    console.log(`\n📸 생성 중: ${img.out}...`);
    try {
      const result = await makeTemplateImage(img.tpl, img.badge, img.main, img.sub, img.cta, img.out);
      console.log(`   ✅ ${result.file} (${result.sizeKB}KB)`);
    } catch (e) {
      console.error(`   ❌ ${img.out}: ${e.message}`);
    }
  }

  console.log('\n🎉 모든 이미지 생성 완료!');
}

main().catch(e => console.error('❌ Fatal:', e));
