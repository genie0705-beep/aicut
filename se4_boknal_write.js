const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  
  // Redirect=Write 탭 확인, 없으면 새로 열기
  let wp = pages.find(p => p.url().includes('Redirect=Write'));
  if (!wp) {
    wp = await b.contexts()[0].newPage();
    await wp.goto('https://blog.naver.com/aicut?Redirect=Write&', { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
    await sleep(5000);
  } else {
    await wp.bringToFront();
    await sleep(2000);
  }
  
  const frames = wp.frames();
  let se = null;
  for (const f of frames) {
    if (await f.evaluate(() => typeof SmartEditor !== 'undefined' && !!SmartEditor._editors).catch(() => false)) { se = f; break; }
  }
  if (!se) { console.log('NO SE FRAME'); await b.close(); return; }
  
  console.log('✅ SE 프레임 발견');
  
  // 제목 설정
  await se.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('2026 중복 보양식 추천, 인증샷부터 음식 릴스까지');
  });
  await sleep(500);
  
  // blocks 구성
  const blocks = [
    // === 도입부 ===
    { type: 'paragraph', text: '7월 22일, 2026년 중복이 다가옵니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '초복이 지나고 중복을 앞둔 지금,', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '더위에 지친 몸을 달랠 보양식이 필요한 계절이에요.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'heading2', text: '🗓️ 2026 중복, 7월 22일', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '복날은 초복·중복·말복으로 나뉘는데요.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '2026년 중복은 7월 22일(수)입니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '초복(7/12)이 이미 지났으니, 중복이 다음 복날이에요.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '더위를 이기려면 보양식이 최고죠!', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    
    // === 보양식 TOP5 ===
    { type: 'heading2', text: '🍗 중복 보양식 추천 TOP 5', style: { textAlign: 'center' } },
    { type: 'heading3', text: '1. 삼계탕 — 복날의 대표주자', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '더운 날씨에 닭 한 마리 통째로 넣고 끓인 삼계탕.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '인삼과 대추가 들어가 원기 회복에 최고예요.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'heading3', text: '2. 장어구이 — 스테미나 충전', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '장어는 비타민 A와 D가 풍부한 대표 보양식.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '고소한 장어구이에 초장 찍어 먹으면 여름 건강 완성!', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'heading3', text: '3. 추어탕 — 속 풀리는 한 그릇', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '미꾸라지로 끓인 추어탕은 예로부터 복날 대표 음식.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '칼칼한 국물이 더운 날 입맛도 살려줍니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'heading3', text: '4. 전복죽 — 부드러운 영양식', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '입맛 없을 때 먹기 좋은 전복죽.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '소화도 잘되고 영양도 풍부해 남녀노소 좋아해요.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'heading3', text: '5. 소고기 영양밥 — 든든한 한 끼', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '소고기는 단백질과 철분이 풍부한 보양식.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '영양밥으로 지어 먹으면 든든하고 맛있어요.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    
    // === 인증샷 꿀팁 ===
    { type: 'heading2', text: '📸 음식 인증샷, 잘 찍는 3가지 꿀팁', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '맛있는 음식을 먹을 때 빠질 수 없는 게 바로 인증샷!', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '더 맛있어 보이는 사진을 위한 꿀팁 알려드릴게요.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'heading3', text: 'TIP 1. 자연광 활용하기', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '식당의 누런 조명보다 창가 자연광이 최고.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '음식이 훨씬 선명하고 맛있어 보여요.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'heading3', text: 'TIP 2. 45도 앵글이 기본', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '위에서 내려찍는 탑뷰보다 45도 각도가 가장 무난.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '음식의 높이감과 재질감을 잘 살려줍니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'heading3', text: 'TIP 3. 포트레이트 모드로 배경 흐리게', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '스마트폰 인물 모드로 찍으면 배경이 흐려져', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '음식이 더 돋보이는 사진을 찍을 수 있어요.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    
    // === 음식 릴스 ===
    { type: 'heading2', text: '🎬 찍은 음식 영상, 릴스로 만들기', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '사진만으로 부족하다면? 음식 릴스에 도전해보세요.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '냄비에서 끓는 순간부터 식탁에 차려지는 과정까지.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '짧은 영상 하나가 훨씬 더 많은 공감을 얻습니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '하지만 영상 편집은 쉽지 않죠.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '촬영은 폰으로 하고, 편집은 전문가에게 맡기세요.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '에이컷이 음식 릴스 편집을 도와드립니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '✅ 촬영본만 보내주세요', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '✅ 24시간 이내 편집 완료', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '✅ 숏폼/릴스 맞춤 편집', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    
    // === CTA ===
    { type: 'heading2', text: '💬 지금 상담하고 중복 준비하세요', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '중복에 먹을 맛있는 음식, 인증샷과 릴스로 기록하고 싶다면?', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '에이컷이 영상 편집부터 숏폼 제작까지 도와드립니다.', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '📞 카카오톡: pf.kakao.com/_GIesX/chat', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '📧 이메일: master@aicut.co.kr', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '🌐 홈페이지: https://aicut.co.kr', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '', style: { textAlign: 'center' } },
    
    // === 해시태그 ===
    { type: 'heading3', text: '해시태그', style: { textAlign: 'center' } },
    { type: 'paragraph', text: '#중복 #2026중복 #중복날짜 #보양식 #복날음식 #삼계탕 #장어구이 #추어탕 #전복죽 #소고기영양밥 #복날 #초복중복말복 #여름보양식 #더위이기는음식 #음식인증샷 #음식릴스 #인스타릴스 #숏폼 #음식사진찍는법 #맛집추천 #보양식맛집 #중복맛집 #7월22일 #여름건강 #원기회복 #영상편집 #숏폼편집 #에이컷 #영상편집외주 #릴스편집', style: { textAlign: 'center' } },
  ];
  
  // 데이터 설정
  await se.evaluate((blocks) => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    data.document.blocks = blocks;
    ed.setDocumentData(data);
    
    // canvas.innerHTML 업데이트
    const canvas = document.querySelector('.se-canvas');
    if (canvas) {
      let html = '';
      for (const b of blocks) {
        if (b.type === 'heading2') html += '<h2 style="text-align:' + (b.style.textAlign || 'center') + '">' + b.text + '</h2>';
        else if (b.type === 'heading3') html += '<h3 style="text-align:' + (b.style.textAlign || 'center') + '">' + b.text + '</h3>';
        else if (b.text) html += '<p style="text-align:' + (b.style.textAlign || 'center') + '">' + b.text + '</p>';
        else html += '<p style="text-align:center"><br></p>';
      }
      canvas.innerHTML = html;
    }
  }, blocks);
  await sleep(3000);
  
  // 저장
  await se.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.innerText.trim() === '저장') { btn.click(); return; }
    }
  });
  await sleep(5000);
  
  // 검증
  const v = await se.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const canvas = document.querySelector('.se-canvas');
    const text = canvas ? canvas.innerText : '';
    return {
      title: ed.getDocumentTitle(),
      textLen: text.length,
      hasBok: text.includes('중복'),
      hasFood: text.includes('삼계탕'),
      hasHash: text.includes('#중복'),
      hasCTA: text.includes('pf.kakao'),
      preview: text.substring(0, 100)
    };
  });
  
  console.log('\n=== 📋 최종 검증 ===');
  console.log(JSON.stringify(v, null, 2));
  console.log('\n' + (v.textLen > 500 ? '✅ 작성 완료! (' + v.textLen + '자)' : '⚠️ 불완전'));
  
  await b.close();
})();
