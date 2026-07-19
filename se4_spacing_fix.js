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
  
  // 1. 제목 설정
  await se.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('중복 보양식, 인증샷부터 음식 릴스까지');
  });
  
  // 2. blocks 구성 (간격 보강)
  const blocks = [
    { type: 'heading2', text: '중복 보양식, 인증샷부터 음식 릴스까지', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '"또 삼계탕만 먹을 순 없잖아?"', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '7월 22일.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '2026년 <strong>중복</strong>입니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '초복은 벌써 지났고.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '이제 <strong>중복</strong>이 코앞이에요.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '더위에 지쳐서.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '아무것도 하기 싫은 날.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '<strong>보양식</strong>으로 원기 회복.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '지금이 바로 그 타이밍입니다.', style: { textAlign: 'center' } },
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
    { type: 'paragraph', text: '인삼과 대추 듬뿍 넣고.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '푹 끓여낸 뽀얀 국물.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '속까지 따뜻해집니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '✅ <strong>장어구이</strong>', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '스테미나 충전.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '비타민 A·D 덩어리.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '고소한 장어 껍질.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '부드러운 살점.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '초장 콕 찍어 한 입.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '여름 건강 완성입니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '✅ <strong>추어탕</strong>', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '칼칼한 국물이 끝내줘요.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '예로부터 <strong>복날</strong> 전통 음식.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '미꾸라지로 끓인 국물.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '입맛도 살리고 속도 풀어줍니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '✅ <strong>전복죽</strong>', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '부담 없이 먹는 <strong>보양식</strong>.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '입맛 없을 때 딱입니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '소화도 잘되고.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '영양도 풍부하고.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '남녀노소 누구나 좋아해요.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '✅ <strong>소고기 영양밥</strong>', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '든든한 한 끼.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '단백질과 철분이 풍부.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '소고기와 영양밥의 조화.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '지어 먹으면 든든함이 다릅니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'heading2', text: '📸 음식 인증샷, 잘 찍는 꿀팁', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '맛있는 음식.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '사진으로 남기고 싶죠?', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '<strong>인증샷</strong>에도 꿀팁이 있습니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '🔥 TIP 1. 자연광 활용', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '식당 누런 조명 말고 창가 쪽.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '음식이 훨씬 맛있어 보입니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '🔥 TIP 2. 45도 각도', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '위에서 내려찍는 것보다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '음식 높이감이 살아납니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '🔥 TIP 3. 인물 모드', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '스마트폰 포트레이트 모드.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '음식이 훨씬 돋보입니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'heading2', text: '🎬 찍은 영상, 음식 릴스로 만들기', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '사진만으로 아쉽다면.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '<strong>음식 릴스</strong>에 도전하세요.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '냄비에서 끓는 순간.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '식탁에 차려지는 과정.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '30초면 공감 2배입니다.', style: { textAlign: 'center' } },
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
    { type: 'paragraph', text: '전문가에게 맡기면 퀄리티가 다릅니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '촬영본만 보내주세요.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '자르기·자막·배경음악·효과까지.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '전문가가 전부 처리합니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '🔥 지금 준비하는 사람이 중복도 즐깁니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '🔥 영상 <strong>편집</strong>, 미룰 이유가 없습니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '👇 아래 링크로 문의주시면 무료로 상담해드립니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '📱 카카오톡', style: { textAlign: 'center' } },
    { type: 'paragraph', text: 'pf.kakao.com/_GIesX/chat', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '📧 이메일', style: { textAlign: 'center' } },
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
        if (b.type === 'heading2') {
          html += '<div class="se-component se-text se-l-default"><div class="se-section se-section-text"><div class="se-module se-module-text" style="font-size:18px;font-weight:700;line-height:1.6;margin:16px 0 8px 0;text-align:center">' + b.text + '</div></div></div>';
        } else if (b.type === 'heading3') {
          html += '<div class="se-component se-text se-l-default"><div class="se-section se-section-text"><div class="se-module se-module-text" style="font-size:16px;font-weight:600;line-height:1.6;margin:12px 0 6px 0;text-align:center">' + b.text + '</div></div></div>';
        } else if (b.text) {
          html += '<div class="se-component se-text se-l-default"><div class="se-section se-section-text"><div class="se-module se-module-text" style="font-size:15px;line-height:2.0;margin:6px 0;text-align:center">' + b.text + '</div></div></div>';
        } else {
          html += '<div class="se-component se-text se-l-default"><div class="se-section se-section-text"><div class="se-module se-module-text" style="font-size:15px;line-height:2.0;margin:6px 0;text-align:center"><br></div></div></div>';
        }
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
    const lines = text.split('\n').filter(l => l.trim());
    let styleCheck = '';
    const firstP = canvas ? canvas.querySelector('[class*=se-module]') : null;
    if (firstP) {
      const style = firstP.getAttribute('style') || '';
      styleCheck = style.includes('line-height') ? '✅ 간격 스타일 적용' : '❌ 간격 스타일 없음';
    }
    
    return {
      title: ed.getDocumentTitle(),
      lineCount: lines.length,
      totalLen: text.replace(/\s/g, '').length,
      styleCheck,
      hasHash: text.includes('#중복'),
      hasCTA: text.includes('pf.kakao')
    };
  });
  
  console.log('\n=== ✅ 수정 완료 ===');
  console.log('제목:', v.title);
  console.log('본문:', v.totalLen + '자 /', v.lineCount + '줄');
  console.log('스타일:', v.styleCheck);
  console.log('해시태그:', v.hasHash ? '✅' : '❌');
  console.log('CTA:', v.hasCTA ? '✅' : '❌');
  console.log('\n📌 SE4 기본 스타일 구조 적용 완료!');
  console.log('   - line-height: 2.0 (넉넉한 간격)');
  console.log('   - margin: 6px 0 (문단 사이 간격)');
  console.log('   - se-component / se-section / se-module 구조');
  
  await b.close();
})();
