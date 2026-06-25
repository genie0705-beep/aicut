const { makeImage } = require('./image_gen');

async function run() {
  const imgs = [
    {
      theme: 'light_pink', width: 700, height: 700,
      badge: '😤 영상빡침 #2',
      main: '영상 편집,\n진짜 빡쳐본 사람만\n아는 <em>현타</em> 이야기',
      sub: '클린트 10번, 수정 요청 30회, 결국...',
      cta: 'AICUT 무료상담 →',
      out: 'aicut_blog_angry_thumb.png'
    },
    {
      theme: 'dark_purple', width: 800, height: 450,
      badge: '😡 현실',
      main: '\"이 부분 컬러 톤만 살짝...\"\n<em>클린트 10번째</em>',
      sub: '한 땀 한 땀 만든 영상, 돌아온 건 수정 요청뿐',
      cta: '에이컷이 바꾼 후기 →',
      out: 'aicut_blog_angry_retake.png'
    },
    {
      theme: 'light_cyan', width: 800, height: 450,
      badge: '💡 빡침의 해결',
      main: '편집 외주, 클린트 5번 이상이면\n<em>그냥 갈아타는 게 답</em>',
      sub: '시간도 아깝고, 정신 건강도 아깝다',
      cta: '갈아타기 →',
      out: 'aicut_blog_angry_solution.png'
    },
    {
      theme: 'dark_green', width: 800, height: 450,
      badge: '📊 비교',
      main: '일반 외주 vs 에이컷\n<em>클린트 횟수부터 다르다</em>',
      sub: '무제한 수정, 전담 에디터, 정기 납품',
      cta: '비교해보기 →',
      out: 'aicut_blog_angry_compare.png'
    },
    {
      theme: 'dark_purple', width: 800, height: 450,
      badge: '📞 지금 바꾸세요',
      main: '영상 때문에 빡친 사람들,\n<em>더 이상 고생하지 마세요</em>',
      sub: '편집 스트레스 제로, 에이컷에 맡기세요',
      cta: '무료 상담 신청 →',
      out: 'aicut_blog_angry_cta.png'
    }
  ];

  for (const img of imgs) {
    console.log('생성:', img.out);
    const r = await makeImage(img);
    console.log('✅', r.file, '(' + r.sizeKB + 'KB)');
  }
  console.log('완료');
}
run().catch(e => console.error('❌', e.message));
