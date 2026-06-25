const { makeImage } = require('./skills/image_gen');

async function run() {
  const cards = [
    { theme:'dark_purple', width:700, height:700, badge:'🛒 라이브커머스', main:'라이브 다시보기,\n<em>편집 하나</em>로\n전환율 3배 차이', sub:'같은 방송, 다른 편집 — 매출이 달라진다', cta:'AICUT 무료상담 →', out:'insta_cards/live_card1.png' },
    { theme:'light_pink', width:700, height:700, badge:'📉 현실', main:'2시간 라이브,\n그냥 올리면\n<em>이탈률 80%</em>', sub:'시청자는 원하는 상품을 찾지 못해 떠난다', cta:'에이컷 도입기 →', out:'insta_cards/live_card2.png' },
    { theme:'dark_green', width:700, height:700, badge:'💡 해결', main:'라이브 1회 →\n<em>숏폼 5개</em> 제작\n전환율 2.1% 달성', sub:'2시간 → 5분, 편집이 매출을 바꿨다', cta:'에이컷에 맡기기 →', out:'insta_cards/live_card3.png' },
    { theme:'dark_purple', width:700, height:700, badge:'📞 지금 상담', main:'쇼핑몰·라이브커머스\n<em>영상 편집</em>\n에이컷에 맡기세요', sub:'라이브 다시보기 + 숏폼 동시 제작, 편당 10만 원대', cta:'무료 상담 신청 →', out:'insta_cards/live_card4.png' }
  ];
  for (const c of cards) { const r = await makeImage(c); console.log('✅', r.file, '(' + r.sizeKB + 'KB)'); }
  console.log('카드 생성 완료');
}
run().catch(e => console.error('❌', e.message));
