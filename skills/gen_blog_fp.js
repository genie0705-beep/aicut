const { makeTemplateImage } = require('./image_gen.js');

async function main() {
  const images = [
    { tpl:'main', out:'aicut_blog_fp_main.png',
      badge:'보험 마케팅', main:'FP·보험설계사라면\n상반기 마케팅 성과\n<em>숏폼 전략</em>으로\n마무리하세요',
      sub:'상반기 분석 → 하반기 준비, 에이컷과 함께', cta:'AICUT 무료상담 →' },
    { tpl:'card', out:'aicut_blog_fp_card1.png',
      badge:'📊 상반기 트렌드', main:'보험 마케팅,\n<em>영상 콘텐츠</em>로\n전환율 2배 차이',
      sub:'FP 브랜딩, 이제 SNS 영상이 결정한다', cta:'AICUT →' },
    { tpl:'cardDark', out:'aicut_blog_fp_card2.png',
      badge:'🚀 하반기 전략', main:'하반기 FP 마케팅\n<em>숏폼 영상</em>으로\n준비하는 방법',
      sub:'릴스·쇼츠·틱톡, 채널별 최적화 전략', cta:'AICUT →' },
    { tpl:'card', out:'aicut_blog_fp_card3.png',
      badge:'✅ 실제 사례', main:'보험설계사 A님\n영상 마케팅 도입 후\n<em>예약률 180%</em> 상승',
      sub:'정기 납품으로 꾸준한 콘텐츠 유지', cta:'AICUT →' },
    { tpl:'ctaCard', out:'aicut_blog_fp_cta.png',
      badge:'지금 시작하세요', main:'보험 마케팅,\n에이컷에 <em>아웃소싱</em>하고\n하반기 준비 끝',
      sub:'월 정기 납품 · 숏폼 전문 · 빠른 턴어라운드', cta:'무료 상담 →' }
  ];

  for (const img of images) {
    console.log(`🖼️ 생성 중: ${img.out}...`);
    const r = await makeTemplateImage(img.tpl, img.badge, img.main, img.sub, img.cta, img.out);
    console.log(`  ✅ ${r.file} (${r.sizeKB}KB)`);
  }
  console.log('\n✅ 모든 이미지 생성 완료!');
}

main().catch(e => { console.error('❌ 실패:', e.message); process.exit(1); });
