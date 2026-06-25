// 카드뉴스 4장 생성 (인스타그램용)
const { makeImage } = require('./skills/image_gen.js');

async function main() {
  var theme = 'dark_purple';
  
  // 카드1: 제목
  console.log('1/4 카드1 - 제목...');
  await makeImage({
    theme,
    badge: '영상빡침일기 #2',
    main: '아이 영상\n<em>500개</em> 찍어놓고\nUSB만 쌓아둔\n부모님들 특징',
    sub: '공감 100% 육아 현실',
    cta: '에이컷 무료상담',
    out: 'aicut_card_kids_01.png',
    width: 700, height: 700
  });
  
  // 카드2: 문제
  console.log('2/4 카드2 - 문제...');
  await makeImage({
    theme,
    badge: '부모님 현실',
    main: '갤러리 영상 500개\n<em>편집 엄두</em> 안 남\n\u2192 USB에 쌓인 지 3년',
    sub: '퇴근 후 편집 = 새벽 2시',
    cta: '',
    out: 'aicut_card_kids_02.png',
    width: 700, height: 700
  });
  
  // 카드3: 깨달음
  console.log('3/4 카드3 - 깨달음...');
  await makeImage({
    theme,
    badge: '깨달음',
    main: '부모 역할은\n<em>찍는</em> 거지\n편집이 아니다',
    sub: '편집은 프로에게, 감상은 가족이 함께',
    cta: '',
    out: 'aicut_card_kids_03.png',
    width: 700, height: 700
  });
  
  // 카드4: 해결+CTA
  console.log('4/4 카드4 - 해결...');
  await makeImage({
    theme,
    badge: '에이컷 솔루션',
    main: '찍기만 하세요\n<em>48시간</em> 내 납품\nAI + 전담 에디터',
    sub: 'USB 대신 폰으로 바로 감상',
    cta: '무료 상담 aicut.co.kr',
    out: 'aicut_card_kids_04.png',
    width: 700, height: 700
  });
  
  console.log('\n카드뉴스 4장 생성 완료!');
}

main().catch(function(e) { console.error('실패:', e.message); });
