// 릴스 카드뉴스 4장 생성 (블로그 #3 기반)
const { makeImage } = require('./skills/image_gen.js');

async function main() {
  var t = 'dark_purple';
  
  console.log('1/4 카드1 - 제목');
  await makeImage({ theme:t, badge:'영상빡침일기 #3', main:'릴스 조회수\n3일 만든 영상보다\n<em>3시간</em> 만든 영상이\n더 잘 나가는 이유', sub:'알고리즘의 비밀을 알면 시간이 절약된다', cta:'에이컷 무료상담', out:'aicut_card_reels_01.png', width:700, height:700 });
  
  console.log('2/4 카드2 - 충격 비교');
  await makeImage({ theme:t, badge:'실제 경험', main:'3일 편집\n= 조회수 <em>200</em>\n\n3시간 편집\n= 조회수 <em>23,000</em>', sub:'차이 100배, 이유는 처음 3초에 있다', cta:'', out:'aicut_card_reels_02.png', width:700, height:700 });
  
  console.log('3/4 카드3 - 알고리즘');
  await makeImage({ theme:t, badge:'릴스 알고리즘 4대 신호', main:'<em>처음 3초</em>\n시청자 멈추게 하라\n\n체류율 > 다시보기\n> 공유 > 댓글', sub:'화려한 편집보다 강력한 첫인상', cta:'', out:'aicut_card_reels_03.png', width:700, height:700 });
  
  console.log('4/4 카드4 - 해결+CTA');
  await makeImage({ theme:t, badge:'에이컷 솔루션', main:'메시지는 기획하고\n<em>편집은 에이컷</em>에\n맡기세요', sub:'적절한 편집 + 강력한 메시지의 조합', cta:'무료상담 aicut.co.kr', out:'aicut_card_reels_04.png', width:700, height:700 });
  
  console.log('\n카드뉴스 4장 생성 완료!');
}

main().catch(e => console.error('실패:', e.message));
