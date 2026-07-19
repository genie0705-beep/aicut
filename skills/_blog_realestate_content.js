// 부동산 중개사무소 블로그 본문 작성 (수정)
// 참조: https://blog.naver.com/aicut/224329284493 (피부과 글 스타일)

const TITLE = '부동산 중개사무소, 매물 영상 하나로 계약률이 달라집니다';

// 해시태그 30개 — 10개씩 3줄로 분할
const HASHTAG_LINES = [
  '#부동산마케팅 #부동산영상 #공인중개사 #부동산중개 #매물영상 #분양마케팅 #숏폼마케팅 #부동산릴스 #영상편집외주 #영상편집',
  '#에이컷 #부동산SNS #부동산유튜브 #모델하우스영상 #분양영상 #부동산쇼츠 #릴스마케팅 #여름분양 #하반기분양 #부동산인스타',
  '#부동산마케팅전략 #영상마케팅 #중개사마케팅 #부동산광고 #숏폼영상',
  '#부동산홍보 #매물마케팅 #중개업소마케팅 #부동산전문가 #AICUT'
];

// 본문 HTML
function buildBodyHTML() {
  const rows = [];
  function p(text, extraClass) {
    rows.push(`<p style="text-align: center;">${text}</p>`);
  }
  function h2(text) {
    // Naver SE4에서 h2 사용: <h2 style="text-align: center;">...</h2>
    rows.push(`<h2 style="text-align: center;"><strong>${text}</strong></h2>`);
  }
  function br() {
    rows.push('<p style="text-align: center;">&nbsp;</p>');
  }
  function img(src, alt) {
    rows.push(`<p style="text-align: center;"><img src="${src}" alt="${alt}" style="width: 100%;" /></p>`);
  }

  // ===== 본문 시작 =====
  p('"요즘 사진만 올리면 문의가 안 와요."');
  p('부동산 중개사무소를 운영하는');
  p('지인분이 요즘 가장 많이 하는 말입니다.');
  br();

  p('몇 년 전만 해도 매물 사진 몇 장이면');
  p('하루에 3~4통씩 문의가 들어왔는데요.');
  p('지금은 상황이 완전히 달라졌습니다.');
  br();

  p('고객들은 이제 <strong>영상</strong>을 원합니다.');
  p('사진으로는 공간 감이 안 잡히니까요.');
  p('실제로 <strong>매물 영상</strong>을 올린');
  p('중개사무소는 문의량이 평균 2~3배');
  p('증가했다고 합니다.');
  br();

  // === card1 이미지 ===
  img('aicut_blog_realestate_card1.png', '부동산 중개사무소 영상 마케팅 중요성');
  br();

  // === H2: 사진만으로는 안 팔리는 시대 ===
  h2('☀️ 사진만으로는 안 팔리는 시대');
  br();

  p('생각해보세요.');
  p('여러분이 집을 구한다고 가정해볼게요.');
  p('사진 5장보다 30초짜리 영상 하나가');
  p('훨씬 더 현장감 있지 않나요?');
  br();

  p('거실이 실제로 얼마나 넓은지,');
  p('채광이 어떤지, 주변 환경은 어떤지...');
  p('이는 사진으로 전달하기 어렵습니다.');
  br();

  p('특히 요즘처럼 <strong>부동산 규제 완화</strong>로');
  p('거래가 살아나는 시기에는요.');
  p('더 빠르게, 더 정확하게');
  p('정보를 전달하는 쪽이 결국');
  p('계약까지 이어집니다.');
  br();

  // === card2 이미지 ===
  img('aicut_blog_realestate_card2.png', '릴스 쇼츠 부동산 숏폼 마케팅 전략');
  br();

  // === H2: 릴스·쇼츠 하나로 문의량이 3배 ===
  h2('📱 릴스·쇼츠 하나로 문의량이 3배');
  br();

  p('직접 경험한 사례를 하나 소개할게요.');
  p('서초동의 한 중개사무소는');
  p('아파트 매물 하나를 30초 <strong>릴스</strong>로');
  p('제작했습니다.');
  br();

  p('그 결과, 조회수 8,000회에');
  p('문의가 12건이나 들어왔어요.');
  p('사진만 올렸을 때는');
  p('문의가 3~4건이었거든요.');
  p('<strong>무려 3배 차이</strong>입니다.');
  br();

  p('이게 바로 <strong>숏폼 마케팅</strong>의 힘입니다.');
  p('릴스, 쇼츠, 틱톡 같은 숏폼 플랫폼은');
  p('알고리즘이 지역 기반 콘텐츠를');
  p('적극적으로 밀어주기 때문이에요.');
  br();

  p('내 사무소 근처에 사는 사람들에게');
  p('내 매물이 노출되는 거죠.');
  p('이보다 더 정확한');
  p('<strong>타겟 마케팅</strong>이 있을까요?');
  br();

  // === card3 이미지 ===
  img('aicut_blog_realestate_card3.png', '하반기 분양 시즌 모델하우스 영상 마케팅 준비');
  br();

  // === H2: 하반기 분양 시즌 ===
  h2('🏗️ 하반기 분양 시즌, 지금부터 준비하세요');
  br();

  p('7월부터 본격적인');
  p('<strong>하반기 분양 시즌</strong>입니다.');
  p('여름 방학을 앞두고');
  p('이사 수요도 늘어나고요.');
  p('지금이 바로 <strong>영상 마케팅</strong>을');
  p('준비할 타이밍입니다.');
  br();

  p('모델하우스 오픈 영상,');
  p('단지 내부 투어 영상,');
  p('주변 인프라 소개 영상...');
  p('생각보다 할 수 있는');
  p('콘텐츠가 많습니다.');
  br();

  // === H2: 편집은 에이컷에 ===
  h2('✂️ 편집은 에이컷에 맡기고, 본업에 집중하세요');
  br();

  p('문제는 <strong>편집</strong>이죠.');
  p('직접 촬영하는 건 그래도 할 만한데,');
  p('편집하려면 시간도 기술도 부족합니다.');
  br();

  p('촬영은 공인중개사님이 직접 하세요.');
  p('고객과의 신뢰는');
  p('본인만이 전달할 수 있으니까요.');
  p('하지만 편집은 <strong>전문가</strong>에게');
  p('맡기세요.');
  br();

  p('에이컷은 <strong>부동산 영상 편집</strong>에');
  p('특화된 프로페셔널 에디터들이');
  p('모여 있습니다.');
  br();

  p('✅ 매주 정해진 요일에 영상 납품');
  p('✅ 1~2일 내 빠른 턴어라운드');
  p('✅ 숏폼 최적화 편집');
  p('✅ 합리적인 월 정기 가격');
  br();

  p('특히 <strong>분양대행사</strong>나');
  p('<strong>중개법인</strong>처럼');
  p('대량 영상이 필요한 곳이라면');
  p('월 정기 납품이 가장 효율적입니다.');
  br();

  // === CTA 이미지 ===
  img('aicut_blog_realestate_cta.png', '에이컷 부동산 영상 편집 무료 견적 문의');
  br();

  // === CTA 텍스트 ===
  h2('📞 지금 바로 문의하세요');
  br();

  p('💬 카카오톡: pf.kakao.com/_GIesX/chat');
  p('📧 이메일: master@aicut.co.kr');
  p('🌐 홈페이지: aicut.co.kr');
  br();

  p('무료 상담과 견적, 부담 없이 문의하세요.');
  p('에이컷이 여러분의');
  p('<strong>부동산 영상 마케팅</strong>을');
  p('책임집니다.');
  br();

  // 해시태그 3줄
  HASHTAG_LINES.forEach(line => {
    p(line);
  });

  return rows.join('\n');
}

function calcStats() {
  const html = buildBodyHTML();
  const paragraphs = html.split('\n').filter(l => l.includes('text-align: center;') && !l.includes('nbsp;'));
  const textOnly = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const chars = textOnly.length;
  
  const over70 = paragraphs.filter(p => {
    const t = p.replace(/<[^>]+>/g, '').trim();
    return t.length > 70;
  });

  const strongs = html.match(/<strong>/g);
  const h2s = html.match(/<h2/g);
  
  return {
    chars,
    paragraphs: paragraphs.length,
    over70Count: over70.length,
    over70Details: over70.map(p => ({ len: p.replace(/<[^>]+>/g,'').trim().length, text: p.replace(/<[^>]+>/g,'').trim().slice(0,60) })),
    avgLen: Math.round(paragraphs.reduce((a,p) => a + p.replace(/<[^>]+>/g,'').trim().length, 0) / paragraphs.length),
    strongCount: strongs ? strongs.length : 0,
    h2Count: h2s ? h2s.length : 0,
  };
}

// 실행 시 통계 출력
if (require.main === module) {
  console.log('=== 부동산 중개사무소 블로그 통계 ===');
  console.log('제목:', TITLE);
  console.log(JSON.stringify(calcStats(), null, 2));
}

module.exports = { TITLE, HASHTAG_LINES, buildBodyHTML, calcStats };
