const { makeImage } = require('./skills/image_gen.js');
const env = { ...process.env, CDP_PORT: '9224' };
process.env.CDP_PORT = '9224';

const images = [
  // 1. 대표 이미지 - 700x700
  {
    theme: 'dark_purple',
    badge: '📋 영상 편집 외주 가이드',
    main: '영상 편집 외주,\n처음이라면\n<em>꼭 물어봐야 할</em>\n5가지',
    sub: '외주사 비교 전 이 질문부터 확인하세요',
    cta: 'AICUT 무료상담 →',
    out: 'aicut_blog_5q_thumb.png',
    width: 700, height: 700
  },
  // 2. Q1 - 브랜드 이해
  {
    theme: 'light_cyan',
    badge: 'Q1. 브랜드 이해도',
    main: '"우리 스타일을\n<em>이해하고</em> 있나요?"',
    sub: '브랜드 컬러·폰트·톤앤매너까지\n외주사가 우리를 이해하는 데 시간을 투자하는지 확인하세요',
    cta: '',
    out: 'aicut_blog_5q_q1.png',
    width: 800, height: 450
  },
  // 3. Q2 - 수정 범위
  {
    theme: 'dark_green',
    badge: 'Q2. 수정 정책',
    main: '"<em>수정 범위</em>와\n횟수는 어떻게 되나요?"',
    sub: '기본 수정 횟수, 추가 비용, 오탈자 수정까지\n계약 전에 명확히 확인해야 합니다',
    cta: '',
    out: 'aicut_blog_5q_q2.png',
    width: 800, height: 450
  },
  // 4. Q3 - 납품 일정
  {
    theme: 'dark_purple',
    badge: 'Q3. 납품 일정',
    main: '"<em>납품 일정</em>은\n어떻게 되나요?"',
    sub: '1차 결과물까지 며칠? 긴급 건 가능?\n납품 형식과 동시 의뢰 일정까지 체크',
    cta: '',
    out: 'aicut_blog_5q_q3.png',
    width: 800, height: 450
  },
  // 5. Q4+Q5 - 저작권 + 업종사례
  {
    theme: 'light_pink',
    badge: 'Q4·Q5. 저작권·경험',
    main: '"<em>저작권</em>과\n<em>업종 사례</em>는\n어떻게 되나요?"',
    sub: '결과물 소유권·BGM 라이선스·포트폴리오\n우리 업종 경험이 있는지 반드시 확인',
    cta: '',
    out: 'aicut_blog_5q_q4.png',
    width: 800, height: 450
  }
];

(async () => {
  console.log('=== 블로그 이미지 5장 생성 ===\n');
  for (const img of images) {
    try {
      const result = await makeImage(img);
      console.log(`✅ ${result.file} (${result.sizeKB}KB)`);
    } catch (e) {
      console.error(`❌ ${img.out}: ${e.message}`);
    }
  }
  console.log('\n=== 5장 생성 완료 ===');
})();
