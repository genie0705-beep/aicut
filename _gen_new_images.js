const { makeImage } = require('./skills/image_gen.js');
process.env.CDP_PORT = '9224';

async function main() {
  const images = [
    // 1. 대표 이미지 (700x700)
    {
      theme: 'light_cyan', badge: '🏢 분양 마케팅',
      main: '분양대행사\n브로셔만 들다가\n<em>영상 마케팅</em>으로\n하반기 매출 2배',
      sub: '직접 부딪힌 3개월의 기록',
      cta: 'AICUT 무료상담 →',
      out: 'aicut_blog_estate_main.png', width: 700, height: 700
    },
    // 2. 악순환의 3개월 (600x338)
    {
      theme: 'dark_purple', badge: '🔄 시행착오',
      main: '1달: 자신감\n2달: 좌절\n<em>3달: 현타</em>',
      sub: '직접 하려다 3개월 날린 이야기',
      cta: 'AICUT 해결 →',
      out: 'aicut_blog_estate_cycle.png', width: 600, height: 338
    },
    // 3. 비용 비교 (600x338)
    {
      theme: 'light_pink', badge: '💰 현실 계산',
      main: '인력 1명 300만원\n<em>외주 50~100만원</em>\n퀄리티는 더 높은데',
      sub: '직접 하는 게 오히려 손해였다',
      cta: 'AICUT 견적 →',
      out: 'aicut_blog_estate_cost.png', width: 600, height: 338
    },
    // 4. 채널 전략 (600x338)
    {
      theme: 'dark_green', badge: '📱 3채널 전략',
      main: '릴스·쇼츠·틱톡\n<em>채널별 맞춤</em>\n콘텐츠 전략',
      sub: '감성/정보/트렌드, 각각 다르게',
      cta: 'AICUT 전략 →',
      out: 'aicut_blog_estate_channel.png', width: 600, height: 338
    },
    // 5. 외주 후 변화 (600x338)
    {
      theme: 'light_cyan', badge: '✅ 바뀐 점 4가지',
      main: '① 밤 11시에 잡니다\n② 퀄리티 UP\n③ 비용 DOWN\n④ 팀원 표정 😂',
      sub: '외주 맡기고 인생이 바뀌었다',
      cta: 'AICUT 후기 →',
      out: 'aicut_blog_estate_after.png', width: 600, height: 338
    },
    // 6. CTA (600x338)
    {
      theme: 'dark_purple', badge: '🚀 지금 시작',
      main: '하반기 준비\n<em>에이컷과 함께</em>',
      sub: '카톡: pf.kakao.com/_GIesX/chat',
      cta: 'AICUT 상담 신청',
      out: 'aicut_blog_estate_cta.png', width: 600, height: 338
    }
  ];

  console.log('=== 새 이미지 생성 시작 ===');
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    console.log(`[${i+1}/${images.length}] ${img.out}...`);
    try {
      const r = await makeImage(img);
      console.log(`  ✅ ${r.file} (${r.sizeKB}KB)`);
    } catch(e) {
      console.error(`  ❌ ${e.message}`);
    }
  }
  console.log('=== 완료 ===');
}

main().catch(e => console.error('실패:', e));
