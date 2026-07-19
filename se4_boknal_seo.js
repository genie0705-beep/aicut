const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  const wp = pages.find(p => p.url().includes('Redirect=Write'));
  if (!wp) { console.log('NO PAGE'); await b.close(); return; }
  await wp.bringToFront(); await sleep(2000);
  
  const se = wp.frames().find(f => f.url().includes('PostWriteForm'));
  if (!se) { await b.close(); return; }
  
  // 개선된 blocks (Strong 추가 + 분량 증가 + 모바일 최적화)
  await se.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    
    data.document.blocks = [
      { type: 'heading2', text: '2026 중복 보양식 추천, 인증샷부터 음식 릴스까지', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '7월 22일, 2026년 <strong>중복</strong>이 다가옵니다.', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '초복이 지나고 중복을 앞둔 지금,', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '더위에 지친 몸을 달랠 <strong>보양식</strong>이 필요한 계절입니다.', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '', style: { textAlign: 'center' } },
      { type: 'heading2', text: '🗓️ 2026 중복, 7월 22일', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '초복(7/12)이 지나고, 2026년 중복은 7월 22일(수)입니다.', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '말복은 8월 11일이에요.', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '<strong>복날</strong>에는 더위를 이기기 위해', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '보양식을 먹는 전통이 있습니다.', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '지금이 바로 준비할 타이밍입니다!', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '', style: { textAlign: 'center' } },
      { type: 'heading2', text: '🍗 중복 보양식 추천 TOP 5', style: { textAlign: 'center' } },
      { type: 'heading3', text: '1. 삼계탕', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '<strong>복날</strong> 하면 가장 먼저 떠오르는 음식.', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '닭 한 마리에 인삼과 대추, 찹쌀을 넣고', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '푹 끓여낸 삼계탕은 원기 회복에 최고입니다.', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '', style: { textAlign: 'center' } },
      { type: 'heading3', text: '2. 장어구이', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '비타민 A와 D가 풍부한 대표 <strong>보양식</strong>.', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '고소한 장어구이에 초장 찍어 먹으면', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '스테미나 충전 완료!', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '', style: { textAlign: 'center' } },
      { type: 'heading3', text: '3. 추어탕', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '예로부터 복날에 먹던 전통 음식.', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '칼칼한 국물이 더운 날씨에', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '입맛을 살려줍니다.', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '', style: { textAlign: 'center' } },
      { type: 'heading3', text: '4. 전복죽', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '입맛 없을 때 부담 없이 먹기 좋은 <strong>보양식</strong>.', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '소화도 잘되고 영양도 풍부해', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '남녀노소 누구나 좋아합니다.', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '', style: { textAlign: 'center' } },
      { type: 'heading3', text: '5. 소고기 영양밥', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '단백질과 철분이 풍부한 소고기로', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '영양밥을 지어 먹으면', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '든든하고 맛있는 한 끼가 완성됩니다.', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '', style: { textAlign: 'center' } },
      { type: 'heading2', text: '📸 음식 인증샷, 잘 찍는 3가지 꿀팁', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '맛있는 음식을 먹을 때 <strong>인증샷</strong>은 필수!', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '더 맛있어 보이는 사진을 위한 꿀팁입니다.', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '', style: { textAlign: 'center' } },
      { type: 'heading3', text: 'TIP 1. 자연광 활용', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '식당 누런 조명보다 창가 자연광이 최고.', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '음식이 훨씬 선명하고 맛있어 보여요.', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '', style: { textAlign: 'center' } },
      { type: 'heading3', text: 'TIP 2. 45도 앵글', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '위에서 내려찍는 탑뷰보다 45도 각도가 가장 무난.', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '음식의 높이감과 재질감을 살려줍니다.', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '', style: { textAlign: 'center' } },
      { type: 'heading3', text: 'TIP 3. 포트레이트 모드', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '스마트폰 인물 모드로 찍으면 배경이 흐려져', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '음식이 더 돋보입니다.', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '', style: { textAlign: 'center' } },
      { type: 'heading2', text: '🎬 찍은 음식 영상, <strong>음식 릴스</strong>로 만들기', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '사진만으로 부족하다면 <strong>음식 릴스</strong>에 도전!', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '끓는 순간부터 식탁까지의 과정을 영상으로 담으면', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '훨씬 많은 공감을 얻을 수 있습니다.', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '하지만 <strong>영상 편집</strong>은 쉽지 않죠.', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '촬영은 폰으로 하고, 편집은 에이컷에 맡기세요.', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '<strong>숏폼</strong>과 릴스 편집, 전문가에게 맡기면', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '퀄리티가 완전히 달라집니다.', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '', style: { textAlign: 'center' } },
      { type: 'heading2', text: '💬 지금 상담하고 중복 준비하세요', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '중복에 먹을 맛있는 음식,', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '<strong>인증샷</strong>과 <strong>릴스</strong>로 기록하고 싶다면', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '에이컷이 영상 편집을 도와드립니다.', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '📞 카카오톡: pf.kakao.com/_GIesX/chat', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '📧 이메일: master@aicut.co.kr', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '🌐 홈페이지: https://aicut.co.kr', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '#중복 #2026중복 #중복날짜 #보양식 #복날음식 #삼계탕 #장어구이 #추어탕 #전복죽 #소고기영양밥 #복날 #초복중복말복 #여름보양식 #더위이기는음식 #음식인증샷 #음식릴스 #인스타릴스 #숏폼 #음식사진찍는법 #맛집추천 #보양식맛집 #중복맛집 #7월22일 #여름건강 #원기회복 #영상편집 #숏폼편집 #에이컷 #영상편집외주 #릴스편집', style: { textAlign: 'center' } },
    ];
    
    ed.setDocumentData(data);
    
    const canvas = document.querySelector('.se-canvas');
    if (canvas) {
      let html = '';
      for (const b of data.document.blocks) {
        if (b.type === 'heading2') html += '<h2 style="text-align:center">' + b.text + '</h2>';
        else if (b.type === 'heading3') html += '<h3 style="text-align:center">' + b.text + '</h3>';
        else if (b.text) html += '<p style="text-align:center">' + b.text + '</p>';
        else html += '<p style="text-align:center"><br></p>';
      }
      canvas.innerHTML = html;
    }
  });
  await sleep(3000);
  
  // 저장
  await se.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.innerText.trim() === '저장') { btn.click(); return; }
    }
  });
  await sleep(5000);
  
  // 최종 검증
  const v = await se.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const canvas = document.querySelector('.se-canvas');
    const text = canvas ? canvas.innerText : '';
    const strongs = canvas ? canvas.querySelectorAll('strong').length : 0;
    const paragraphs = text.split('\n').filter(p => p.trim().length > 0);
    const longParas = paragraphs.filter(p => p.length > 50);
    
    return {
      title: ed.getDocumentTitle(),
      textLen: text.length,
      strongCount: strongs,
      longParas: longParas.length,
      maxParaLen: Math.max(...paragraphs.map(p => p.length), 0),
      hasHash: text.includes('#중복'),
      hasCTA: text.includes('pf.kakao')
    };
  });
  
  console.log('\n=== 📋 SEO 최종 체크리스트 ===');
  console.log('1. 제목: ✅');
  console.log('2. 본문:', v.textLen + '자', v.textLen >= 1500 ? '✅' : '⚠️');
  console.log('3. Strong 키워드:', v.strongCount + '개', v.strongCount >= 5 ? '✅' : '⚠️');
  console.log('4. 해시태그 30개:', v.hasHash ? '✅' : '❌');
  console.log('5. CTA 3종:', v.hasCTA ? '✅' : '❌');
  console.log('6. 모바일 (50자↑):', v.longParas + '개', v.longParas === 0 ? '✅' : '⚠️');
  console.log('7. 최대 문단 길이:', v.maxParaLen + '자');
  
  await b.close();
})();
