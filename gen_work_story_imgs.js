// 📸 직장인 썰 블로그 이미지 생성 (2026-06-19)
const { makeImage, THEMES } = require('./skills/image_gen.js');

async function main() {
  // 커스텀 테마 - 다크 퍼플 (에이컷 시그니처)
  const theme = 'dark_purple';
  
  // 1. 대표 이미지 (700x700)
  console.log('1️⃣ 대표 이미지 생성 중...');
  await makeImage({
    theme,
    badge: '🎬 영상빡침일기 #1',
    main: '영상편집 외주,\n새벽 3시까지\n혼자 붙잡다가\n<em>포기한 직장인</em>의 썰',
    sub: '3개월의 삽질 끝에 깨달은 진실',
    cta: '에이컷 무료상담 →',
    out: 'aicut_blog_worker.png',
    width: 700,
    height: 700
  });
  
  // 2. 본문 이미지 1 (700x400) - 악순환
  console.log('2️⃣ 본문 이미지 1 생성 중...');
  await makeImage({
    theme,
    badge: '😵 악순환의 3개월',
    main: '퇴근 → 아이 재우기\n→ <em>새벽 3시</em> 편집\n→ 다시 출근',
    sub: '영상 1편 만드는 데 5시간...',
    cta: '',
    out: 'aicut_body_worker_cycle.png',
    width: 700,
    height: 400
  });
  
  // 3. 본문 이미지 2 (700x400) - 비용 계산
  console.log('3️⃣ 본문 이미지 2 생성 중...');
  await makeImage({
    theme,
    badge: '💡 깨달음',
    main: '내 시간 = 시간당 3만원\n영상 1편 = <em>5시간 = 15만원</em>\n외주 비용 = 5~10만원',
    sub: '편집하는 게 오히려 손해였다 🤯',
    cta: '',
    out: 'aicut_body_worker_cost.png',
    width: 700,
    height: 400
  });
  
  // 4. 본문 이미지 3 (700x400) - 변화 후
  console.log('4️⃣ 본문 이미지 3 생성 중...');
  await makeImage({
    theme,
    badge: '✅ 에이컷 도입 후',
    main: '밤 11시에 <em>잠</em>\n퀄리티 <em>UP</em>\n와이프 표정 <em>GOOD</em> 😂',
    sub: '직장인은 편집 대신 기획할 시간에 집중',
    cta: '',
    out: 'aicut_body_worker_after.png',
    width: 700,
    height: 400
  });
  
  console.log('\n✅ 모든 이미지 생성 완료!');
}

main().catch(e => console.error('❌ 실패:', e.message));
