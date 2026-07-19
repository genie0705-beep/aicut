// 유튜버/크리에이터 블로그 본문
const TITLE = '유튜버·크리에이터라면 숏폼 편집, 왜 직접 하면 손해일까요?';

function buildBodyHTML() {
  const lines = [];
  function p(text) { lines.push(`<p style="text-align: center;">${text}</p>`); }
  function h2(text) { lines.push(`<h2 style="text-align: center;"><strong>${text}</strong></h2>`); }
  function br() { lines.push('<p style="text-align: center;">&nbsp;</p>'); }
  function img(src, alt) { lines.push(`<p style="text-align: center;"><img src="${src}" alt="${alt}" style="width: 100%;" /></p>`); }

  p('"쇼츠 하나 편집하는데 하루가 다 가요."');
  p('유튜브 크리에이터라면');
  p('누구나 한 번쯤 해본 말입니다.');
  br();
  p('영상 찍는 시간보다');
  p('편집하는 시간이 3배는 더 걸리죠.');
  p('자르고, 붙이고, 자막 넣고,');
  p('BGM 맞추고, 효과 넣고...');
  br();
  p('이 시간에 차라리');
  p('다음 콘텐츠 구상을 하거나');
  p('휴식을 취하는 게');
  p('채널 성장에 더 도움이 됩니다.');
  br();
  img('aicut_blog_youtuber_card1.png', '유튜버 크리에이터 숏폼 편집 시간 아웃소싱');
  br();
  h2('⏰ 숏폼 하나에 하루 4시간?');
  br();
  p('30초짜리 쇼츠 하나 편집하는 데');
  p('보통 2~4시간이 걸립니다.');
  p('자막, 화면 전환, 배경 음악,');
  p('썸네일까지 하면 더 오래 걸리고요.');
  br();
  p('일주일에 3개만 올려도');
  p('<strong>12시간</strong>이 편집에 사라집니다.');
  p('이 시간을 콘텐츠 기획과');
  p('촬영에 쓴다면?');
  p('채널 성장 속도가');
  p('완전히 달라집니다.');
  br();
  img('aicut_blog_youtuber_card2.png', '유튜브 쇼츠 릴스 숏폼 업로드 빈도 전략');
  br();
  h2('📱 업로드 빈도가 채널 성장의 핵심');
  br();
  p('2026년 숏폼 알고리즘은');
  p('<strong>업로드 빈도</strong>를');
  p('가장 중요하게 봅니다.');
  p('자주 올릴수록');
  p('알고리즘이 밀어줍니다.');
  br();
  p('하지만 편집 시간 때문에');
  p('주 1~2개도 버거운 현실.');
  p('여기에 <strong>편집 아웃소싱</strong>이');
  p('해결책이 됩니다.');
  br();
  p('편집만 맡기면');
  p('주 5~7개 업로드도 가능합니다.');
  p('조회수와 구독자 성장은');
  p('덤으로 따라옵니다.');
  br();
  img('aicut_blog_youtuber_card3.png', 'AI 영상 편집 vs 전문 에디터 비교');
  br();
  h2('🤖 AI 편집 vs 전담 에디터');
  br();
  p('요즘 AI 편집 툴이 많아졌지만,');
  p('크리에이터의 <strong>개성과 감각</strong>은');
  p('AI가 따라올 수 없습니다.');
  br();
  p('에이컷의 에디터들은');
  p('각 크리에이터의 스타일을');
  p('빠르게 파악하고 학습합니다.');
  p('자막 스타일, BGM 취향,');
  p('편집 템포까지 일관되게 유지하죠.');
  br();
  p('AI는 도구일 뿐,');
  p('감각은 사람의 몫입니다.');
  br();
  img('aicut_blog_youtuber_cta.png', '에이컷 크리에이터 숏폼 편집 정기 납품');
  br();
  h2('✂️ 편집은 에이컷에, 콘텐츠는 당신에게');
  br();
  p('에이컷은 <strong>크리에이터 전용</strong>');
  p('숏폼 편집 서비스입니다.');
  br();
  p('✅ 영상만 보내면 48시간 내 편집 완료');
  p('✅ 크리에이터 스타일 학습 + 일관된 퀄리티');
  p('✅ 쇼츠·릴스·틱톡 최적화 포맷');
  p('✅ 월 정기 납품으로 부담 DOWN');
  br();
  p('촬영은 크리에이터가,');
  p('편집은 에이컷이.');
  p('이게 가장 효율적인');
  p('<strong>채널 운영 공식</strong>입니다.');
  br();
  h2('📞 지금 바로 문의하세요');
  br();
  p('💬 카카오톡: pf.kakao.com/_GIesX/chat');
  p('📧 이메일: master@aicut.co.kr');
  p('🌐 홈페이지: aicut.co.kr');
  br();
  p('무료 상담과 견적, 부담 없이 문의하세요.');
  p('에이컷이 여러분의');
  p('<strong>숏폼 편집</strong>을 책임집니다.');
  br();

  // 해시태그 30개 — 줄 단위
  p('#유튜브숏폼 #크리에이터 #숏폼편집 #영상편집외주 #에이컷 #유튜브쇼츠');
  p('#릴스마케팅 #틱톡마케팅 #채널성장 #유튜브알고리즘 #숏폼마케팅');
  p('#영상편집 #크리에이터마케팅 #유튜버 #편집아웃소싱 #여름콘텐츠');
  p('#AI영상편집 #구독자늘리기 #채널운영 #정기납품 #에디터');
  p('#쇼츠편집 #릴스편집 #바이럴 #콘텐츠마케팅 #1인미디어');
  p('#크리에이터경제 #숏폼크리에이터 #에이컷편집 #숏츠 #쇼츠마케팅');

  return lines.join('\n');
}

function calcStats() {
  const html = buildBodyHTML();
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const paras = html.split('\n').filter(l => l.includes('text-align: center;') && !l.includes('nbsp;'));
  const over70 = paras.filter(p => p.replace(/<[^>]+>/g, '').trim().length > 70);
  const strong = html.match(/<strong>/g);
  const h2Tags = html.match(/<h2/g);
  return {
    chars: text.length,
    paras: paras.length,
    over70: over70.length,
    avgLen: Math.round(paras.reduce((a, p) => a + p.replace(/<[^>]+>/g, '').trim().length, 0) / paras.length),
    strong: strong ? strong.length : 0,
    h2: h2Tags ? h2Tags.length : 0,
  };
}

if (require.main === module) {
  console.log('제목:', TITLE);
  console.log(JSON.stringify(calcStats(), null, 2));
}

module.exports = { TITLE, buildBodyHTML, calcStats };
