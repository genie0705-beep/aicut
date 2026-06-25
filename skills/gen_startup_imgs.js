// 스타트업/IR 블로그 이미지 5장 생성
const { makeImage } = require('./image_gen');

async function run() {
  const imgs = [
    // 1. 대표 이미지 (700x700)
    {
      theme: 'dark_purple', width: 700, height: 700,
      badge: '🚀 스타트업 마케팅',
      main: 'IR 피칭 3번 실패하고\nAI 툴 5개 써본\n<em>스타트업</em>이 찾은\n해결책',
      sub: '영상 하나가 피칭의 운명을 바꾼다',
      cta: 'AICUT 무료상담 →',
      out: 'aicut_blog_startup_thumb.png'
    },
    // 2. 문제/통계 (800x450)
    {
      theme: 'light_pink', width: 800, height: 450,
      badge: '📉 현실',
      main: '<em>3번의 IR 피칭</em>,\n3번의 실패\n투자자들은 영상도 안 봤다',
      sub: '텍스트 PDF만으로는 설득할 수 없습니다',
      cta: 'AICUT이 바꾼 스토리 →',
      out: 'aicut_blog_startup_problem.png'
    },
    // 3. AI 툴 vs 전문 편집 비교 (800x450)
    {
      theme: 'dark_green', width: 800, height: 450,
      badge: '💡 비교',
      main: 'AI 툴 5개 써봤지만\n<em>편집 10년차</em> 에디터를\n이길 순 없었다',
      sub: 'AI는 도구일 뿐, 완성은 사람의 몫',
      cta: '에이컷 에디터阵容 보기 →',
      out: 'aicut_blog_startup_compare.png'
    },
    // 4. 해결 인사이트 (800x450)
    {
      theme: 'light_cyan', width: 800, height: 450,
      badge: '✨ 인사이트',
      main: 'IR 영상 하나로\n<em>후속 미팅 5건</em> 확보\n무엇이 달랐을까?',
      sub: '같은 스크립트, 다른 편집 — 결과는 완전히 달랐다',
      cta: '사례 자세히 보기 →',
      out: 'aicut_blog_startup_insight.png'
    },
    // 5. CTA (800x450)
    {
      theme: 'dark_purple', width: 800, height: 450,
      badge: '📞 지금 바로 상담',
      main: 'IR 앞둔 스타트업,\n<em>영상 편집</em> 고민이라면\n에이컷에 맡기세요',
      sub: '피칭 영상 · IR 소개 영상 · 기업 홍보 영상 전문 제작',
      cta: '무료 상담 신청 →',
      out: 'aicut_blog_startup_cta.png'
    }
  ];

  for (const img of imgs) {
    console.log('생성 중:', img.out);
    const r = await makeImage(img);
    console.log('✅', r.file, `(${r.sizeKB}KB)`);
  }

  console.log('\n🎉 모든 이미지 생성 완료');
}

run().catch(e => console.error('❌ 실패:', e));
