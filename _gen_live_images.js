const { makeTemplateImage } = require('./skills/image_gen.js');

// CDP_PORT 명시
process.env.CDP_PORT = '9224';

async function main() {
  const images = [
    // 1. 대표 이미지 (700×700, dark_purple, CTA 버튼 유지)
    {
      tpl: 'main',
      badge: '🔴 LIVE',
      main: '라이브커머스\nC-커머스 시대\n<em>편집이 곧 매출</em>이다',
      sub: '다시보기 편집으로 전환율 2.1% 달성',
      cta: 'AICUT 무료상담 →',
      out: 'aicut_blog_live_main.png'
    },
    // 2. 본문 카드1 (600×338, light_warm, CTA 버튼 제거 + AICUT 문구 제거)
    {
      tpl: 'card',
      badge: '🛒 다시보기 편집',
      main: '2시간→5분 압축',
      sub: '편집이 시청 완료율을 결정합니다',
      cta: '',
      out: 'aicut_blog_live_card1.png'
    },
    // 3. 본문 카드2 (600×338, dark_purple, CTA 버튼 제거 + AICUT 문구 제거)
    {
      tpl: 'cardDark',
      badge: '📊 편집 효과',
      main: '전환율 0.3% → 2.1%',
      sub: '편집 하나가 만든 매출 차이',
      cta: '',
      out: 'aicut_blog_live_card2.png'
    },
    // 4. 본문 카드3 (600×338, light_warm, CTA 버튼 제거 + AICUT 문구 제거)
    {
      tpl: 'card',
      badge: '🔥 C-커머스 대응',
      main: '차별화는 콘텐츠',
      sub: '숏폼 편집이 경쟁력입니다',
      cta: '',
      out: 'aicut_blog_live_card3.png'
    },
    // 5. CTA (600×338, dark_green)
    {
      tpl: 'ctaCard',
      badge: 'AICUT',
      main: '라이브 다시보기',
      sub: '3일 이내 납품 + 무제한 수정',
      cta: '무료상담 신청 →',
      out: 'aicut_blog_live_cta.png'
    }
  ];

  for (const img of images) {
    console.log(`\n🎨 생성중: ${img.out}...`);
    try {
      const r = await makeTemplateImage(img.tpl, img.badge, img.main, img.sub, img.cta, img.out);
      console.log(`✅ ${r.file} (${r.sizeKB}KB)`);
    } catch(e) {
      console.error(`❌ ${img.out} 실패: ${e.message}`);
    }
  }

  console.log('\n=== 이미지 생성 완료 ===');
}

main();
