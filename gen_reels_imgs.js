// 릴스 블로그 이미지 생성 (영상빡침일기 #3)
const { makeImage } = require('./skills/image_gen.js');

async function main() {
  // 1. 대표 이미지
  console.log('1/4 대표 이미지 생성...');
  await makeImage({
    theme: 'dark_purple',
    badge: '영상빡침일기 #3',
    main: '릴스 조회수\n3일 만든 영상보다\n<em>3시간</em> 만든 영상이\n더 잘 나가는 이유',
    sub: '알고리즘의 비밀을 알면 시간이 절약된다',
    cta: '에이컷 무료상담',
    out: 'aicut_blog_reels.png',
    width: 700, height: 700
  });
  
  // 2. 본문 이미지 1 - 3일 vs 3시간 비교
  console.log('2/4 본문 이미지 1 생성...');
  await makeImage({
    theme: 'dark_purple',
    badge: '실제 경험담',
    main: '3일 편집 = 조회수 200\n<em>3시간 편집</em> = 조회수 23,000',
    sub: '차이 100배, 이유가 뭘까?',
    cta: '',
    out: 'aicut_body_reels_compare.png',
    width: 700, height: 400
  });
  
  // 3. 본문 이미지 2 - 알고리즘 4대 신호
  console.log('3/4 본문 이미지 2 생성...');
  await makeImage({
    theme: 'dark_purple',
    badge: '릴스 알고리즘',
    main: '<em>처음 3초</em>가 모든 걸 결정한다\n체류율 > 다시보기 > 공유 > 댓글',
    sub: '화려한 편집보다 강력한 첫인상',
    cta: '',
    out: 'aicut_body_reels_algorithm.png',
    width: 700, height: 400
  });
  
  // 4. 본문 이미지 3 - 해결책
  console.log('4/4 본문 이미지 3 생성...');
  await makeImage({
    theme: 'dark_purple',
    badge: '에이컷 솔루션',
    main: '메시지는 기획하고\n<em>편집은 에이컷</em>에\n맡기세요',
    sub: '적절한 편집 + 강력한 메시지의 조합',
    cta: '',
    out: 'aicut_body_reels_solution.png',
    width: 700, height: 400
  });
  
  console.log('\n이미지 4장 생성 완료!');
}

main().catch(function(e) { console.error('실패:', e.message); });
