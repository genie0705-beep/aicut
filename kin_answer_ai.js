const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(()=>{}));
  
  const url = 'https://kin.naver.com/qna/detail.naver?d1id=8&dirId=8080105&docId=493566474';
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
  await p.waitForTimeout(4000);
  
  // 답변하기 버튼 클릭
  const btn = await p.$('button._answerWriteButton');
  if (!btn) { console.log('답변하기 버튼 없음'); await b.close(); return; }
  await btn.scrollIntoViewIfNeeded();
  await p.waitForTimeout(500);
  await btn.click();
  await p.waitForTimeout(3000);
  
  // contenteditable div 찾기
  const editor = await p.$('div[contenteditable="true"]');
  if (!editor) { console.log('에디터 없음'); await b.close(); return; }
  
  // 에디터에 답변 내용 입력
  const answer = `안녕하세요, AI 영상 제작을 찾고 계시는군요.

설명해주신 플로우(위성 데이터가 층층이 쌓이고 → AI 분석 → 위험 감지 → 현장 대응)를 구현하려면 크게 두 가지 접근법이 있습니다.

1) AI 영상 생성 툴 직접 사용
- Runway Gen-3: 텍스트나 이미지를 업로드하면 원하는 모션으로 영상을 생성해줍니다. 이미지를 업로드하고 "데이터가 아래에서 위로 쌓이는" 식의 프롬프트를 입력하면 비슷한 느낌을 만들 수 있어요.
- Pika Labs: 이미지를 기반으로 카메라 무빙(위로 팬, 줌인 등)을 지정할 수 있어서, 말씀하신 "밑에서부터 천천히 빛을 받으며 한 층씩 쌓이는" 연출에 적합합니다.
- Kling / Vidu: 중국 쪽 AI 영상 툴인데, 최근 퀄리티가 많이 좋아졌습니다. 특히 사진을 자연스럽게 움직이는 능력이 뛰어나요.

2) 전문가 의뢰
원하는 플로우가 구체적이고 정밀한 연출이 필요하다면, 위 AI 툴들을 다룰 줄 아는 전문가에게 의뢰하는 게 결과물이 좋습니다.
- 크몽에서 "AI 영상 제작" 또는 "모션그래픽"으로 검색하시면 포트폴리오를 보고 고를 수 있어요.
- 의뢰하실 때는 설명해주신 것처럼 장면별 타임라인을 문서로 정리해서 전달하면 견적도 정확하고 만족도도 높습니다.

추가로, AI 영상 툴이 계속 발전하고 있어서 직접 해보시는 것도 추천드립니다. 각 툴이 무료 체험을 제공하는 경우가 많으니 한 번 테스트해보시고 결정하셔도 좋아요.`;

  // contenteditable에 텍스트 입력
  await editor.click();
  await p.waitForTimeout(500);
  
  await editor.evaluate((el, text) => {
    el.focus();
    document.execCommand('insertText', false, text);
  }, answer);
  
  await p.waitForTimeout(1000);
  
  console.log('✅ 답변 입력 완료');
  console.log('길이:', answer.length, '자');
  
  // 등록 버튼 찾기
  const registerBtnInfo = await p.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.innerText.includes('등록') || btn.innerText.includes('작성') || btn.innerText.includes('저장') || btn.innerText.includes('완료')) {
        return { text: btn.innerText.substring(0, 20), class: btn.className, id: btn.id };
      }
    }
    return null;
  });
  
  console.log('등록 버튼:', JSON.stringify(registerBtnInfo));
  
  // 버튼이 있으면 클릭
  if (registerBtnInfo) {
    const registerBtn = await p.$('button:has-text("등록"), button:has-text("작성"), button:has-text("저장")');
    if (registerBtn) {
      console.log('등록 버튼 찾음, 클릭 전 2초 대기...');
      await p.waitForTimeout(2000);
      await registerBtn.click();
      await p.waitForTimeout(3000);
      console.log('✅ 답변 등록 완료!');
    }
  }
  
  console.log('\n📝 참고: 답변 등록은 브라우저에서 직접 확인해주세요.');
  console.log('답변 내용이 에디터에 입력된 상태입니다.');
  
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 300)));
