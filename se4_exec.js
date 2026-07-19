const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  let wp = pages.find(p => p.url().includes('Redirect=Write'));
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
    SmartEditor._editors['blogpc001'].setDocumentTitle('무더위에 지친 보험설계사라면? 하반기 숏폼 마케팅으로 승부보세요');
  });
  await sleep(500);
  
  // 2. focusFirstText + clearContent 같은 게 있는지
  await se.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    ed.focusFirstText();
  });
  await sleep(1000);
  
  // 3. 전체 내용 선택 후 삭제 (execCommand)
  await se.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    // 전체 선택
    const canvas = document.querySelector('.se-canvas');
    if (canvas) {
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(canvas);
      sel.removeAllRanges();
      sel.addRange(range);
    }
    ed.execCommand('delete');
  });
  await sleep(1000);
  
  // 4. HTML 삽입
  const html = '<h2 style="text-align:center">무더위, 보험설계사에게 가장 힘든 계절이 돌아왔습니다.</h2>' +
'<p style="text-align:center">7월 한낮 기온이 33도를 넘나듭니다.</p>' +
'<p style="text-align:center">보험설계사라면 누구나 공감할 거예요.</p>' +
'<p style="text-align:center">더운 날씨에 만남 잡기도 어렵고, 하반기 준비는 해야 하는데 막막하기만 하죠.</p>' +
'<p style="text-align:center"><br></p>' +
'<h2 style="text-align:center">☀️ 무더위, 보험설계사가 마주한 3가지 현실</h2>' +
'<h3 style="text-align:center">1. 만남 자체가 어려워진 계절</h3>' +
'<p style="text-align:center">무더위에 지친 고객들은 만남을 꺼립니다. "더우니까 다음에 만나요"라는 말에 속이 타들어가는 경험, 다들 있으시죠?</p>' +
'<p style="text-align:center"><br></p>' +
'<h3 style="text-align:center">2. 열정이 식어가는 업계 분위기</h3>' +
'<p style="text-align:center">여름만 되면 영업력이 떨어지는 건 비단 당신만의 문제가 아닙니다. 대부분의 보험설계사가 같은 고민을 해요.</p>' +
'<p style="text-align:center"><br></p>' +
'<h3 style="text-align:center">3. 경쟁은 더 치열해지는 시장</h3>' +
'<p style="text-align:center">하반기로 갈수록 경쟁은 치열해집니다. 같은 방식으로는 차별화가 어려운 현실이에요.</p>' +
'<p style="text-align:center"><br></p>' +
'<h2 style="text-align:center">🎯 보험설계사 마케팅, 숏폼이 답이다</h2>' +
'<p style="text-align:center">이제는 숏폼 마케팅이 대세입니다. 릴스, 쇼츠, 틱톡으로 고객과 연결되는 시대가 왔어요.</p>' +
'<p style="text-align:center"><br></p>' +
'<h3 style="text-align:center">✅ 보장 분석 콘텐츠</h3>' +
'<p style="text-align:center">고객이 궁금해하는 보장 내용을 1분 안에 정리해주는 영상. 전문성 어필에 효과적입니다.</p>' +
'<p style="text-align:center"><br></p>' +
'<h3 style="text-align:center">✅ 고객 후기 숏폼</h3>' +
'<p style="text-align:center">실제 보험금 지급 사례나 만족 고객 인터뷰를 숏폼으로. 신뢰도를 높이는 최고의 방법이에요.</p>' +
'<p style="text-align:center"><br></p>' +
'<h3 style="text-align:center">✅ FP 일상 브이로그</h3>' +
'<p style="text-align:center">진정성 있는 일상 콘텐츠로 고객과의 친밀감을 쌓으세요. 꾸준한 소통이 신뢰를 줍니다.</p>' +
'<p style="text-align:center"><br></p>' +
'<h2 style="text-align:center">🔥 7월부터 시작해야 하는 이유</h2>' +
'<p style="text-align:center">하반기 영상 마케팅은 지금 준비해야 9월부터 성과가 납니다. 숏폼은 꾸준함이 생명입니다.</p>' +
'<p style="text-align:center"><br></p>' +
'<h2 style="text-align:center">✂️ 숏폼 편집, 직접 하시겠어요?</h2>' +
'<p style="text-align:center">촬영은 할 수 있어도 편집은 어렵죠. 그래서 영상편집외주가 필요합니다. 에이컷이 도와드립니다.</p>' +
'<p style="text-align:center"><br></p>' +
'<h2 style="text-align:center">💬 지금 상담받고 하반기 준비하세요</h2>' +
'<p style="text-align:center">지금 바로 상담 신청하세요. 첫 달 20% 할인 이벤트 진행 중입니다.</p>' +
'<p style="text-align:center"><br></p>' +
'<p style="text-align:center">📞 카카오톡: pf.kakao.com/_GIesX/chat</p>' +
'<p style="text-align:center">📧 이메일: master@aicut.co.kr</p>' +
'<p style="text-align:center">🌐 홈페이지: https://aicut.co.kr</p>' +
'<p style="text-align:center"><br></p>' +
'<h3 style="text-align:center">해시태그</h3>' +
'<p style="text-align:center">#보험설계사 #무더위 #하반기마케팅 #숏폼마케팅 #영상편집외주 #보험마케팅 #FP마케팅 #릴스마케팅 #인스타릴스 #유튜브쇼츠 #틱톡마케팅 #숏폼콘텐츠 #영상마케팅 #에이컷 #영상편집 #숏폼편집 #보험영업 #보험FP #하반기준비 #영상제작 #마케팅전략 #SNS마케팅 #콘텐츠마케팅 #보험상담 #재무설계 #FP브랜딩 #보험숏폼 #여름마케팅 #7월마케팅 #영상외주</p>';
  
  await se.evaluate((h) => {
    const ed = SmartEditor._editors['blogpc001'];
    ed.execCommand('insertHTML', h);
  }, html);
  await sleep(3000);
  
  // 5. 저장
  await se.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.innerText.trim() === '저장') { btn.click(); return; }
    }
  });
  await sleep(5000);
  
  // 6. 확인
  const v = await se.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const canvas = document.querySelector('.se-canvas');
    const text = canvas ? canvas.innerText : '';
    return {
      title: ed.getDocumentTitle(),
      textLen: text.length,
      hasBody: text.includes('무더위'),
      hasCTA: text.includes('pf.kakao'),
      hasHash: text.includes('#보험설계사'),
      contentText: ed.getContentText().substring(0, 100)
    };
  });
  
  console.log('\n=== 최종 결과 ===');
  console.log(JSON.stringify(v, null, 2));
  
  if (v.hasBody && v.hasCTA && v.hasHash) {
    console.log('✅ 본문 복구 성공!');
  } else {
    console.log('⚠️ 불완전, 추가 처리 필요');
  }
  
  await b.close();
})();
