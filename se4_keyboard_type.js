const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  let wp = pages.find(p => p.url().includes('Redirect=Write'));
  if (!wp) {
    wp = await b.contexts()[0].newPage();
    await wp.goto('https://blog.naver.com/aicut?Redirect=Write&', { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
    await sleep(5000);
  }
  await wp.bringToFront(); await sleep(2000);
  
  // SE 프레임 찾기
  const frames = wp.frames();
  let se = null;
  for (const f of frames) {
    if (await f.evaluate(() => typeof SmartEditor !== 'undefined' && !!SmartEditor._editors).catch(() => false)) { se = f; break; }
  }
  if (!se) { console.log('NO SE'); await b.close(); return; }
  
  console.log('✅ SE 프레임\n');
  
  // 1. 제목 설정 (API 호출은 그대로 유지 - 사람도 제목 입력란에 직접 침)
  await se.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('중복 보양식, 인증샷부터 음식 릴스까지');
  });
  await sleep(1000);
  
  // 2. canvas에 focus
  await se.evaluate(() => {
    const canvas = document.querySelector('.se-canvas');
    if (canvas) {
      // 내용 비우기
      canvas.innerHTML = '';
      canvas.focus();
    }
  });
  await sleep(1000);
  
  // 3. keyboard로 직접 입력 (사람이 키보드 치는 방식)
  console.log('키보드 입력 시작...');
  
  // 전체 텍스트 (Strong은 Ctrl+B로 처리, 먼저 평문 입력 후 Bold 처리)
  const lines = [
    { type: 'h2', text: '중복 보양식, 인증샷부터 음식 릴스까지' },
    { type: 'p', text: '' },
    { type: 'p', text: '"또 삼계탕만 먹을 순 없잖아?"' },
    { type: 'p', text: '7월 22일.' },
    { type: 'p', text: '2026년 중복입니다.', bold: true },
    { type: 'p', text: '초복은 벌써 지났고.' },
    { type: 'p', text: '이제 중복이 코앞이에요.', bold: true },
    { type: 'p', text: '' },
    { type: 'p', text: '더위에 지쳐서.' },
    { type: 'p', text: '아무것도 하기 싫은 날.' },
    { type: 'p', text: '보양식으로 원기 회복.', bold: true },
    { type: 'p', text: '지금이 바로 그 타이밍입니다.' },
    { type: 'p', text: '' },
    { type: 'p', text: '🍗 그런데 말입니다.' },
    { type: 'p', text: '매년 같은 보양식만.', bold: true },
    { type: 'p', text: '먹다 보면 질리기 마련.' },
    { type: 'p', text: '올해는 좀 다르게.' },
    { type: 'p', text: '준비해보면 어떨까요?' },
    { type: 'p', text: '' },
    { type: 'h2', text: '🍗 중복 보양식 추천 TOP 5' },
    { type: 'p', text: '' },
    { type: 'p', text: '✅ 삼계탕', bold: true },
    { type: 'p', text: '복날 하면 이거죠.', bold: true },
    { type: 'p', text: '닭 한 마리 통째로.' },
    { type: 'p', text: '인삼과 대추 듬뿍 넣고.' },
    { type: 'p', text: '푹 끓여낸 뽀얀 국물.' },
    { type: 'p', text: '속까지 따뜻해집니다.' },
    { type: 'p', text: '' },
    { type: 'p', text: '✅ 장어구이', bold: true },
    { type: 'p', text: '스테미나 충전.', bold: true },
    { type: 'p', text: '비타민 A·D 덩어리.' },
    { type: 'p', text: '고소한 장어 껍질.' },
    { type: 'p', text: '부드러운 살점.' },
    { type: 'p', text: '초장 콕 찍어 한 입.' },
    { type: 'p', text: '여름 건강 완성입니다.' },
    { type: 'p', text: '' },
    { type: 'p', text: '✅ 추어탕', bold: true },
    { type: 'p', text: '칼칼한 국물이 끝내줘요.', bold: true },
    { type: 'p', text: '예로부터 복날 전통 음식.' },
    { type: 'p', text: '미꾸라지로 끓인 국물.' },
    { type: 'p', text: '입맛도 살리고 속도 풀어줍니다.' },
    { type: 'p', text: '' },
    { type: 'p', text: '✅ 전복죽', bold: true },
    { type: 'p', text: '부담 없이 먹는 보양식.', bold: true },
    { type: 'p', text: '입맛 없을 때 딱입니다.' },
    { type: 'p', text: '소화도 잘되고.' },
    { type: 'p', text: '영양도 풍부하고.' },
    { type: 'p', text: '남녀노소 누구나 좋아해요.' },
    { type: 'p', text: '' },
    { type: 'p', text: '✅ 소고기 영양밥', bold: true },
    { type: 'p', text: '든든한 한 끼.', bold: true },
    { type: 'p', text: '단백질과 철분이 풍부.' },
    { type: 'p', text: '소고기와 영양밥의 조화.' },
    { type: 'p', text: '지어 먹으면 든든함이 다릅니다.' },
    { type: 'p', text: '' },
    { type: 'h2', text: '📸 음식 인증샷, 잘 찍는 꿀팁' },
    { type: 'p', text: '' },
    { type: 'p', text: '맛있는 음식.' },
    { type: 'p', text: '사진으로 남기고 싶죠?' },
    { type: 'p', text: '인증샷에도 꿀팁이 있습니다.', bold: true },
    { type: 'p', text: '' },
    { type: 'p', text: '🔥 TIP 1. 자연광 활용' },
    { type: 'p', text: '식당 누런 조명 말고 창가 쪽.' },
    { type: 'p', text: '음식이 훨씬 맛있어 보입니다.' },
    { type: 'p', text: '' },
    { type: 'p', text: '🔥 TIP 2. 45도 각도' },
    { type: 'p', text: '위에서 내려찍는 것보다.' },
    { type: 'p', text: '음식 높이감이 살아납니다.' },
    { type: 'p', text: '' },
    { type: 'p', text: '🔥 TIP 3. 인물 모드' },
    { type: 'p', text: '스마트폰 포트레이트 모드.' },
    { type: 'p', text: '음식이 훨씬 돋보입니다.' },
    { type: 'p', text: '' },
    { type: 'h2', text: '🎬 찍은 영상, 음식 릴스로 만들기' },
    { type: 'p', text: '' },
    { type: 'p', text: '사진만으로 아쉽다면.' },
    { type: 'p', text: '음식 릴스에 도전하세요.', bold: true },
    { type: 'p', text: '냄비에서 끓는 순간.' },
    { type: 'p', text: '식탁에 차려지는 과정.' },
    { type: 'p', text: '30초면 공감 2배입니다.' },
    { type: 'p', text: '' },
    { type: 'p', text: '그런데 말입니다.' },
    { type: 'p', text: '영상 찍는 건 쉬운데.' },
    { type: 'p', text: '편집이 문제죠.', bold: true },
    { type: 'p', text: '직접 하시겠어요?' },
    { type: 'p', text: '시간도 없고.' },
    { type: 'p', text: '배우기도 번거롭고.' },
    { type: 'p', text: '' },
    { type: 'p', text: '✂️ 편집은 에이컷에 맡기세요' },
    { type: 'p', text: '해결책은 간단합니다.' },
    { type: 'p', text: '촬영만 직접 하세요.' },
    { type: 'p', text: '영상 편집은 에이컷에.', bold: true },
    { type: 'p', text: '숏폼과 릴스.', bold: true },
    { type: 'p', text: '전문가에게 맡기면 퀄리티가 다릅니다.' },
    { type: 'p', text: '촬영본만 보내주세요.' },
    { type: 'p', text: '자르기·자막·배경음악·효과까지.' },
    { type: 'p', text: '전문가가 전부 처리합니다.' },
    { type: 'p', text: '' },
    { type: 'p', text: '🔥 지금 준비하는 사람이 중복도 즐깁니다.' },
    { type: 'p', text: '🔥 영상 편집, 미룰 이유가 없습니다.', bold: true },
    { type: 'p', text: '' },
    { type: 'p', text: '👇 아래 링크로 문의주시면 무료로 상담해드립니다.' },
    { type: 'p', text: '' },
    { type: 'p', text: '📱 카카오톡' },
    { type: 'p', text: 'pf.kakao.com/_GIesX/chat' },
    { type: 'p', text: '' },
    { type: 'p', text: '📧 이메일' },
    { type: 'p', text: 'master@aicut.co.kr' },
    { type: 'p', text: '' },
    { type: 'p', text: '🌐 홈페이지' },
    { type: 'p', text: 'https://aicut.co.kr' },
    { type: 'p', text: '' },
    { type: 'p', text: '#중복 #2026중복 #중복날짜 #보양식 #복날음식 #삼계탕 #장어구이 #추어탕 #전복죽 #소고기영양밥 #복날 #초복중복말복 #여름보양식 #더위이기는음식 #음식인증샷 #음식릴스 #인스타릴스 #숏폼 #음식사진찍는법 #맛집추천 #보양식맛집 #중복맛집 #7월22일 #여름건강 #원기회복 #영상편집 #숏폼편집 #에이컷 #영상편집외주 #릴스편집' },
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.type === 'h2') {
      // 큰 제목 스타일: 에디터에서 h2는 직접 변환 안 되니 ***로 감싸서 구분
      await wp.keyboard.insertText(line.text);
      await wp.keyboard.press('Enter');
      await wp.keyboard.press('Enter');
      await sleep(100);
    } else if (line.type === 'p') {
      if (line.text === '') {
        await wp.keyboard.press('Enter');
        await sleep(30);
      } else {
        // Bold가 필요한 경우 Ctrl+B 토글
        if (line.bold) {
          await wp.keyboard.press('Control+b');
          await sleep(100);
        }
        
        await wp.keyboard.insertText(line.text);
        await sleep(50);
        
        if (line.bold) {
          await wp.keyboard.press('Control+b');
          await sleep(100);
        }
        
        await wp.keyboard.press('Enter');
        await sleep(50);
      }
    }
    
    // 진행상황 표시 (20줄마다)
    if (i % 20 === 0) {
      console.log('   ' + (i+1) + '/' + lines.length + '줄 입력중...');
    }
  }
  
  console.log('   ' + lines.length + '/' + lines.length + '줄 입력 완료!');
  
  // 저장
  await sleep(2000);
  await se.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) { if (btn.innerText.trim() === '저장') { btn.click(); return; } }
  });
  await sleep(5000);
  
  // 확인
  const v = await se.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const canvas = document.querySelector('.se-canvas');
    const text = canvas ? canvas.innerText : '';
    const strongs = canvas ? canvas.querySelectorAll('strong, b').length : 0;
    const lines2 = text.split('\n').filter(l => l.trim());
    return {
      title: ed.getDocumentTitle(),
      textLen: text.replace(/\s/g, '').length,
      lineCount: lines2.length,
      boldCount: strongs,
      hasHash: text.includes('#중복'),
      hasCTA: text.includes('pf.kakao')
    };
  });
  
  console.log('\n=== ✅ 키보드 입력 완료 ===');
  console.log('제목:', v.title);
  console.log('본문:', v.textLen + '자 /', v.lineCount + '줄');
  console.log('굵게:', v.boldCount + '개');
  console.log('해시태그:', v.hasHash ? '✅' : '❌');
  console.log('CTA:', v.hasCTA ? '✅' : '❌');
  
  await b.close();
})();
