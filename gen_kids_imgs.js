// 아이 영상 편집 블로그 이미지 생성 (2026-06-19)
const { makeImage } = require('./skills/image_gen.js');

async function main() {
  var theme = 'dark_purple';
  
  // 1. 대표 이미지 (700x700)
  console.log('1/4 대표 이미지...');
  await makeImage({
    theme,
    badge: '🎬 영상빡침일기 #2',
    main: '아이 영상 500개\n찍어놓고 USB만\n쌓아둔 부모님들,\n<em>결국 에이컷</em>에\n맡겼다',
    sub: '아이의 성장 영상, USB에 묻히지 마세요',
    cta: '에이컷 무료상담 →',
    out: 'aicut_blog_kids.png',
    width: 700,
    height: 700
  });
  
  // 2. 본문 이미지 1 (700x400) - 폰용량
  console.log('2/4 본문 이미지 1...');
  await makeImage({
    theme,
    badge: '📱 부모님 현실',
    main: '갤러리 영상 500개\n<em>USB에 쌓아둔 지</em>\n3년째',
    sub: '편집은 "나중에"가 3년째...',
    cta: '',
    out: 'aicut_body_kids_phone.png',
    width: 700,
    height: 400
  });
  
  // 3. 본문 이미지 2 (700x400) - 시간
  console.log('3/4 본문 이미지 2...');
  await makeImage({
    theme,
    badge: '⏰ 현실',
    main: '아이 영상 1편 = <em>3~4시간</em>\n퇴근 후 편집 = 새벽 2시',
    sub: '부모는 찍기만 하세요, 편집은 에이컷이',
    cta: '',
    out: 'aicut_body_kids_time.png',
    width: 700,
    height: 400
  });
  
  // 4. 본문 이미지 3 (700x400) - 해결
  console.log('4/4 본문 이미지 3...');
  await makeImage({
    theme,
    badge: '💡 해결',
    main: '에이컷에 맡기니\n밤 11시에 <em>잠</em>\n아이 영상은 <em>폰</em>으로',
    sub: '찍기만 하세요, 나머지는 에이컷이',
    cta: '',
    out: 'aicut_body_kids_solve.png',
    width: 700,
    height: 400
  });
  
  console.log('\n✅ 이미지 4장 생성 완료');
}

main().catch(e => console.error('❌ 실패:', e.message));
