const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  const wp = pages.find(p => p.url().includes('Redirect=Write'));
  if (!wp) { console.log('NO PAGE'); await b.close(); return; }
  await wp.bringToFront(); await sleep(2000);
  
  const frames = wp.frames();
  let se = null;
  for (const f of frames) {
    if (await f.evaluate(() => typeof SmartEditor !== 'undefined' && !!SmartEditor._editors).catch(() => false)) { se = f; break; }
  }
  if (!se) { console.log('NO SE'); await b.close(); return; }
  
  console.log('✅ SE 프레임');
  
  await se.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('중복 보양식, 인증샷부터 릴스까지');
  });
  
  // Strong 5개 이상 + 본문 1500자 이상 + H2/H3 5개 이상
  const blocks = [
    { type: 'heading2', text: '중복 보양식, 인증샷부터 릴스까지', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '"또 삼계탕만 먹을 순 없잖아?"', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '7월 22일.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '2026년 <strong>중복</strong>입니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '초복은 벌써 지났습니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '이제 <strong>중복</strong>이 코앞이에요.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '더위에 지쳐서.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '아무것도 하기 싫은 날.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '<strong>보양식</strong>이 필요한 계절입니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '🍗 그런데 말입니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '매년 같은 <strong>보양식</strong>만.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '먹다 보면 질리기 마련.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '올해는 좀 다르게.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '준비해보면 어떨까요?', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'heading2', text: '🍗 중복 보양식 추천 TOP 5', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '✅ <strong>삼계탕</strong>', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '<strong>복날</strong> 하면 이거죠.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '닭 한 마리 통째로.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '인삼과 대추 듬뿍.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '푹 끓여낸 국물이 보약입니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '✅ <strong>장어구이</strong>', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '스테미나 충전.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '비타민 A·D 덩어리.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '고소한 장어에 초장 콕.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '여름 건강 완성입니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '✅ <strong>추어탕</strong>', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '칼칼한 국물이 끝내줘요.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '예로부터 <strong>복날</strong> 전통 음식.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '입맛도 살리고 속도 풀어줍니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '✅ <strong>전복죽</strong>', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '부담 없이 먹는 <strong>보양식</strong>.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '입맛 없을 때 딱입니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '소화도 잘되고 영양도 풍부.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '남녀노소 누구나 좋아해요.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '✅ <strong>소고기 영양밥</strong>', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '든든한 한 끼.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '단백질과 철분이 풍부.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '영양밥으로 지어 먹으면.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '든든함이 완전 다릅니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'heading2', text: '📸 음식 인증샷, 잘 찍는 꿀팁', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '맛있는 음식.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '사진으로 남기고 싶죠?', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '<strong>인증샷</strong>에도 꿀팁이 있습니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '🔥 TIP 1.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '자연광을 활용하세요.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '식당 누런 조명 말고.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '창가 쪽이 정답입니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '🔥 TIP 2.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '45도 각도가 기본.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '위에서 내려찍는 것보다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '음식의 높이감과 식감이 살아납니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '🔥 TIP 3.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '인물 모드로 배경 흐리게.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '스마트폰 포트레이트 모드.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '음식이 훨씬 돋보입니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'heading2', text: '🎬 찍은 영상, 릴스로 만들어보세요', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '사진만으로 아쉽다면.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '<strong>음식 릴스</strong>에 도전하세요.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '냄비에서 끓는 순간.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '식탁에 차려지는 과정.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '30초 영상 하나면.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '공감이 2배입니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '그런데 말입니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '영상 찍는 건 쉬운데.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '<strong>편집</strong>이 문제죠.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '직접 하시겠어요?', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '시간도 없고.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '배우기도 번거롭고.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'heading3', text: '✂️ 편집은 에이컷에 맡기세요', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '해결책은 간단합니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '촬영만 직접 하세요.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '<strong>영상 편집</strong>은 에이컷에.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '<strong>숏폼</strong>과 릴스.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '전문가에게 맡기면.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '퀄리티가 완전 다릅니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '촬영본만 보내주세요.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '자르기·자막·배경음악·효과까지.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '전문가가 전부 처리합니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '🔥 지금 준비하는 사람이', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '🔥 중복도 즐깁니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '🔥 영상 <strong>편집</strong>, 미룰 이유가 없습니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '👇 아래 링크로 문의주시면', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '무료로 상담해드립니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '📱 카카오톡 문의', style: { textAlign: 'center' } },
    { type: 'paragraph', text: 'pf.kakao.com/_GIesX/chat', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '📧 이메일 문의', style: { textAlign: 'center' } },
    { type: 'paragraph', text: 'master@aicut.co.kr', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '🌐 홈페이지', style: { textAlign: 'center' } },
    { type: 'paragraph', text: 'https://aicut.co.kr', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '#중복 #2026중복 #중복날짜 #보양식 #복날음식 #삼계탕 #장어구이 #추어탕 #전복죽 #소고기영양밥 #복날 #초복중복말복 #여름보양식 #더위이기는음식 #음식인증샷 #음식릴스 #인스타릴스 #숏폼 #음식사진찍는법 #맛집추천 #보양식맛집 #중복맛집 #7월22일 #여름건강 #원기회복 #영상편집 #숏폼편집 #에이컷 #영상편집외주 #릴스편집', style: { textAlign: 'center' } },
  ];
  
  await se.evaluate((blocks) => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    data.document.blocks = blocks;
    ed.setDocumentData(data);
    const canvas = document.querySelector('.se-canvas');
    if (canvas) {
      let html = '';
      for (const b of blocks) {
        if (b.type === 'heading2') html += '<h2 style="text-align:center">' + b.text + '</h2>';
        else if (b.type === 'heading3') html += '<h3 style="text-align:center">' + b.text + '</h3>';
        else if (b.text) html += '<p style="text-align:center">' + b.text + '</p>';
        else html += '<p style="text-align:center"><br></p>';
      }
      canvas.innerHTML = html;
    }
  }, blocks);
  await sleep(3000);
  
  await se.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) { if (btn.innerText.trim() === '저장') { btn.click(); return; } }
  });
  await sleep(5000);
  
  const v = await se.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const canvas = document.querySelector('.se-canvas');
    const text = canvas ? canvas.innerText : '';
    const html = canvas ? canvas.innerHTML : '';
    const lines = text.split('\n').filter(l => l.trim());
    const totalLen = text.replace(/\s/g, '').length;
    const avgLen = lines.length > 0 ? Math.round(lines.reduce((a, l) => a + l.length, 0) / lines.length) : 0;
    const strongs = (html.match(/<strong>/g) || []).length;
    const headings = (html.match(/<h2|<h3/g) || []).length;
    const hashCount = (text.match(/#\S+/g) || []).length;
    const longLines = lines.filter(l => l.length > 50);
    
    return {
      title: ed.getDocumentTitle(),
      totalLen, lineCount: lines.length, avgLen,
      strongCount: strongs, headingCount: headings,
      hashCount, longLines: longLines.length
    };
  });
  
  console.log('\n=== ✅ SEO 보강 완료 ===');
  console.log('본문:', v.totalLen + '자 (목표 1500) ' + (v.totalLen >= 1500 ? '✅' : '⚠️'));
  console.log('줄:', v.lineCount + '줄');
  console.log('Strong:', v.strongCount + '개 (목표 5) ' + (v.strongCount >= 5 ? '✅' : '⚠️'));
  console.log('H2/H3:', v.headingCount + '개 (목표 5) ' + (v.headingCount >= 5 ? '✅' : '⚠️'));
  console.log('해시태그:', v.hashCount + '개');
  console.log('50자↑:', v.longLines + '개');
  
  await b.close();
})();
