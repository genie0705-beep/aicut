const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  const wp = pages[2] || pages.find(p => p.url().includes('Redirect=Write'));
  if (!wp) { console.log('NO PAGE'); await b.close(); return; }
  await wp.bringToFront(); await sleep(2000);
  
  const frames = wp.frames();
  let se = null;
  for (const f of frames) {
    if (await f.evaluate(() => typeof SmartEditor !== 'undefined' && !!SmartEditor._editors).catch(() => false)) { se = f; break; }
  }
  if (!se) { console.log('NO SE'); await b.close(); return; }
  
  console.log('✅ SE 프레임 발견');
  
  // 1. 제목 설정
  await se.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('무더위에 지친 보험설계사라면? 하반기 숏폼 마케팅으로 승부보세요');
  });
  await sleep(500);
  
  // 2. blocks 직접 구성 (copy+paste 금지)
  await se.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    
    // 전체 blocks 구성
    data.document.blocks = [
      // === 도입부 ===
      { type: 'heading2', text: '무더위, 보험설계사에게 가장 힘든 계절이 돌아왔습니다.', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '7월 한낮 기온이 33도를 넘나듭니다.', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '보험설계사라면 누구나 공감할 거예요.', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '더운 날씨에 만남 잡기도 어렵고, 하반기 준비는 해야 하는데 막막하기만 하죠.', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '', style: { textAlign: 'center' } },
      
      // === 섹션1: 3가지 현실 ===
      { type: 'heading2', text: '☀️ 무더위, 보험설계사가 마주한 3가지 현실', style: { textAlign: 'center' } },
      { type: 'heading3', text: '1. 만남 자체가 어려워진 계절', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '무더위에 지친 고객들은 만남을 꺼립니다.', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '"더우니까 다음에 만나요"라는 말에 속이 타들어가는 경험, 다들 있으시죠?', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '', style: { textAlign: 'center' } },
      { type: 'heading3', text: '2. 열정이 식어가는 업계 분위기', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '여름만 되면 영업력이 떨어지는 건 비단 당신만의 문제가 아닙니다.', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '대부분의 보험설계사가 같은 고민을 해요. 하반기 목표 달성을 위해선 지금부터 움직여야 합니다.', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '', style: { textAlign: 'center' } },
      { type: 'heading3', text: '3. 경쟁은 더 치열해지는 시장', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '하반기로 갈수록 경쟁은 치열해집니다. 같은 상품, 같은 영업 방식으로는 차별화가 어려운 현실이에요.', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '', style: { textAlign: 'center' } },
      
      // === 섹션2: 숏폼이 답 ===
      { type: 'heading2', text: '🎯 보험설계사 마케팅, 숏폼이 답이다', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '이제는 숏폼 마케팅이 대세입니다. 릴스, 쇼츠, 틱톡 등 숏폼 콘텐츠로 고객과 연결되는 시대가 왔어요.', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '', style: { textAlign: 'center' } },
      { type: 'heading3', text: '✅ 보장 분석 콘텐츠', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '고객이 궁금해하는 보장 내용을 1분 안에 정리해주는 영상. 전문성 어필에 효과적입니다.', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '', style: { textAlign: 'center' } },
      { type: 'heading3', text: '✅ 고객 후기 숏폼', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '실제 보험금 지급 사례나 만족 고객 인터뷰를 숏폼으로. 신뢰도를 높이는 최고의 방법이에요.', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '', style: { textAlign: 'center' } },
      { type: 'heading3', text: '✅ FP 일상 브이로그', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '진정성 있는 일상 콘텐츠로 고객과의 친밀감을 쌓으세요. 꾸준한 소통이 고객 신뢰를 만듭니다.', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '', style: { textAlign: 'center' } },
      
      // === 섹션3: 7월부터 시작 ===
      { type: 'heading2', text: '🔥 7월부터 시작해야 하는 이유', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '하반기 영상 마케팅은 지금 준비해야 9월부터 성과가 납니다. 숏폼 콘텐츠는 꾸준함이 생명이니까요.', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '매주 2~3개의 숏폼을 꾸준히 올리면 3개월 후에는 확실한 채널이 만들어집니다.', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '지금 시작해야 연말까지 안정적인 하반기 마케팅이 가능해요.', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '', style: { textAlign: 'center' } },
      
      // === 섹션4: 편집 외주 ===
      { type: 'heading2', text: '✂️ 숏폼 편집, 직접 하시겠어요?', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '촬영은 할 수 있어도 편집은 어렵죠. 영상 편집에 하루 종일 시간 뺏기면 본업에 집중할 수 없습니다.', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '그래서 영상편집외주가 필요합니다. 에이컷은 보험설계사 전용 숏폼 편집 아웃소싱 서비스를 제공합니다.', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '✅ 촬영본만 보내주세요', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '✅ 24시간 이내 편집 완료', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '✅ 월 정기 납품 할인 적용', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '✅ FP 마케팅 맞춤형 편집', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '', style: { textAlign: 'center' } },
      
      // === CTA ===
      { type: 'heading2', text: '💬 지금 상담받고 하반기 준비하세요', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '무더위가 지나기 전에 준비하는 사람이 하반기 승리자가 됩니다.', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '지금 바로 상담 신청하세요. 첫 달 20% 할인 이벤트 진행 중입니다.', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '📞 카카오톡: pf.kakao.com/_GIesX/chat', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '📧 이메일: master@aicut.co.kr', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '🌐 홈페이지: https://aicut.co.kr', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '', style: { textAlign: 'center' } },
      
      // === 해시태그 ===
      { type: 'heading3', text: '해시태그', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '#보험설계사 #무더위 #하반기마케팅 #숏폼마케팅 #영상편집외주 #보험마케팅 #FP마케팅 #릴스마케팅 #인스타릴스 #유튜브쇼츠 #틱톡마케팅 #숏폼콘텐츠 #영상마케팅 #에이컷 #영상편집 #숏폼편집 #보험영업 #보험FP #하반기준비 #영상제작 #마케팅전략 #SNS마케팅 #콘텐츠마케팅 #보험상담 #재무설계 #FP브랜딩 #보험숏폼 #여름마케팅 #7월마케팅 #영상외주', style: { textAlign: 'center' } },
    ];
    
    // 3. 데이터 설정
    ed.setDocumentData(data);
    
    // 4. canvas.innerHTML 직접 업데이트 (필수!)
    const canvas = document.querySelector('.se-canvas');
    if (canvas) {
      let html = '';
      for (const block of data.document.blocks) {
        if (block.type === 'heading2') {
          html += '<h2 style="text-align:' + (block.style.textAlign || 'center') + '">' + block.text + '</h2>';
        } else if (block.type === 'heading3') {
          html += '<h3 style="text-align:' + (block.style.textAlign || 'center') + '">' + block.text + '</h3>';
        } else {
          if (block.text) {
            html += '<p style="text-align:' + (block.style.textAlign || 'center') + '">' + block.text + '</p>';
          } else {
            html += '<p style="text-align:center"><br></p>';
          }
        }
      }
      canvas.innerHTML = html;
    }
  });
  await sleep(3000);
  
  // 5. 저장
  await se.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.innerText.trim() === '저장') { btn.click(); return; }
    }
  });
  await sleep(5000);
  
  // 6. 검증
  const v = await se.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const canvas = document.querySelector('.se-canvas');
    const text = canvas ? canvas.innerText : '';
    return {
      title: ed.getDocumentTitle(),
      textLen: text.length,
      preview: text.substring(0, 200),
      hasBody: text.includes('무더위'),
      hasHash: text.includes('#보험설계사'),
      hasCTA: text.includes('pf.kakao'),
      blockCount: ed.getDocumentData().document.blocks.length
    };
  });
  
  console.log('\n=== ✅ 최종 검증 ===');
  console.log(JSON.stringify(v, null, 2));
  console.log('\n' + (v.textLen > 500 ? '✅ 본문 작성 완료! (' + v.textLen + '자)' : '⚠️ 불완전'));
  
  await b.close();
})();
