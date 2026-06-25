const { makeImage } = require('./image_gen');

async function run() {
  const imgs = [
    {
      theme: 'dark_purple', width: 700, height: 700,
      badge: '🎬 크리에이터 마케팅',
      main: '구독자 5만 유튜버가\n편집 외주로 바꾼 후\n<em>업로드 주기 3배</em>\n빨라진 이유',
      sub: '혼자 하는 편집, 이제 한계입니다',
      cta: 'AICUT 무료상담 →',
      out: 'aicut_blog_youtube_thumb.png'
    },
    {
      theme: 'light_pink', width: 800, height: 450,
      badge: '📉 현실',
      main: '하루 8시간 편집에 지친\n<em>1인 크리에이터</em>의 고민',
      sub: '촬영보다 편집이 3배 더 오래 걸린다면?',
      cta: '에이컷이 바꾼 스토리 →',
      out: 'aicut_blog_youtube_problem.png'
    },
    {
      theme: 'dark_green', width: 800, height: 450,
      badge: '💡 해결',
      main: '편집 외주 하나로\n<em>업로드 주기 3배</em> 증가\n구독자 반응은 더 좋아졌다',
      sub: '같은 콘텐츠, 다른 편집 — 결과가 다릅니다',
      cta: '비교 자세히 보기 →',
      out: 'aicut_blog_youtube_solution.png'
    },
    {
      theme: 'light_cyan', width: 800, height: 450,
      badge: '✨ 비교',
      main: '혼자 편집 vs AI 툴 vs 에이컷\n<em>직접 비교해보세요</em>',
      sub: '시간·비용·퀄리티 어디서 차이가 날까?',
      cta: 'AICUT에 물어보기 →',
      out: 'aicut_blog_youtube_compare.png'
    },
    {
      theme: 'dark_purple', width: 800, height: 450,
      badge: '📞 지금 상담',
      main: '유튜버·크리에이터라면\n<em>영상 편집</em> 고민\n에이컷에 맡기세요',
      sub: '구독자 1만부터 100만까지, 편집은 에이컷',
      cta: '무료 상담 신청 →',
      out: 'aicut_blog_youtube_cta.png'
    }
  ];

  for (const img of imgs) {
    console.log('생성:', img.out);
    const r = await makeImage(img);
    console.log('✅', r.file, `(${r.sizeKB}KB)`);
  }
  console.log('\n🎉 이미지 5장 생성 완료');
}
run().catch(e => console.error('❌', e.message));
