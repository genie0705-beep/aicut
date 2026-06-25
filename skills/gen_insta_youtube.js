const { makeImage } = require('./skills/image_gen');

async function run() {
  const cards = [
    { theme:'dark_purple', width:700, height:700, badge:'🎬 크리에이터', main:'구독자 5만 유튜버가\n<em>편집 외주</em>로 바꾼 후\n업로드 주기 3배\n빨라진 이유', sub:'혼자 하다 지친 크리에이터를 위한 해결책', cta:'AICUT 무료상담 →', out:'insta_cards/yt_card1.png' },
    { theme:'light_pink', width:700, height:700, badge:'📉 현실', main:'혼자 편집 8시간\nAI 툴도 한계\n<em>크리에이터의 고민</em>', sub:'프리미어·파컷 템플릿? AI 편집? 다 써봤습니다', cta:'에이컷 도입기 →', out:'insta_cards/yt_card2.png' },
    { theme:'dark_green', width:700, height:700, badge:'💡 해결', main:'<em>편집 외주</em> 하나로\n업로드 주기 3배 증가\n퀄리티는 그대로', sub:'편집 시간 56시간 → 10시간, 주 1회 → 3회', cta:'AICUT에 맡기기 →', out:'insta_cards/yt_card3.png' },
    { theme:'dark_purple', width:700, height:700, badge:'📞 지금 상담', main:'유튜버·크리에이터\n<em>영상 편집</em> 고민\n에이컷에 맡기세요', sub:'편당 10만 원대부터 · 무제한 수정 · 전담 에디터', cta:'무료 상담 →', out:'insta_cards/yt_card4.png' }
  ];
  
  for (const c of cards) {
    const r = await makeImage(c);
    console.log('✅', r.file, '(' + r.sizeKB + 'KB)');
  }
  console.log('\n카드 4장 생성 완료');
}
run().catch(e => console.error('❌', e.message));
