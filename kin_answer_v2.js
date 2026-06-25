const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(()=>{}));

  const pages = ctx.pages();
  let p = null;
  for (const pg of pages) {
    if (pg.url().includes('493566474')) { p = pg; break; }
  }
  if (!p) {
    p = await ctx.newPage();
    await p.goto('https://kin.naver.com/qna/detail.naver?d1id=8&dirId=8080105&docId=493566474', { waitUntil: 'networkidle', timeout: 20000 });
    await p.waitForTimeout(3000);
  } else {
    await p.bringToFront();
  }

  // Check if editor is already open
  let hasEditor = await p.$('div[contenteditable="true"]');
  
  if (!hasEditor) {
    // Click 답변하기
    const btn = await p.$('button._answerWriteButton, button.endAnswerRegisterButton._answerWriteButton');
    if (btn) {
      await btn.click();
      await p.waitForTimeout(3000);
      hasEditor = await p.$('div[contenteditable="true"]');
    }
  }

  if (!hasEditor) {
    console.log('에디터를 열 수 없습니다');
    await b.close();
    return;
  }

  console.log('에디터 발견, 답변 입력 시도...');

  const answerText = `안녕하세요, AI 영상 제작 관련해서 도움이 될 만한 내용 공유드립니다.

설명해주신 "위성 데이터가 층층이 쌓이고 → AI 분석 → 위험 감지 → 현장 대응" 플로우를 구현하려면 접근법이 두 가지 있습니다.

1) AI 영상 생성 툴 직접 사용
- Runway Gen-3: 이미지를 업로드하고 원하는 모션을 텍스트로 입력하면 생성됩니다. "데이터가 아래에서 위로 쌓이는" 장면을 프롬프트로 만들 수 있어요.
- Pika Labs: 이미지 기반으로 카메라 무빙(위로 팬, 줌인)을 세밀하게 지정할 수 있어서 말씀하신 연출에 잘 맞습니다.
- Kling / Vidu: 최근 퀄리티가 많이 올라왔고, 사진을 자연스럽게 움직이는 능력이 좋습니다.

2) 외주 의뢰
원하는 연출이 구체적이고 정밀하다면 AI 툴을 다루는 전문가에게 맡기는 게 결과물이 좋습니다. 크몽에서 "AI 영상 제작" 또는 "모션그래픽"으로 검색하시고 포트폴리오를 꼭 확인해보세요.

AI 영상 툴은 대부분 무료 체험을 제공하니, 직접 테스트해보시고 결정하셔도 좋습니다.`;

  // Use innerText + dispatchEvent approach
  await hasEditor.evaluate((el, text) => {
    el.focus();
    el.innerText = '';
    
    // 텍스트를 한 줄씩 입력하며 이벤트 발생
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (i > 0) {
        const br = document.createElement('br');
        el.appendChild(br);
      }
      const textNode = document.createTextNode(lines[i]);
      el.appendChild(textNode);
    }
    
    // input 이벤트 발생 (Naver SE가 감지)
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, answerText);

  await p.waitForTimeout(2000);

  // Verify content was entered
  const contentCheck = await p.evaluate(() => {
    const ed = document.querySelector('div[contenteditable="true"]');
    return ed ? ed.innerText.length : 0;
  });
  console.log('입력된 글자 수:', contentCheck);

  if (contentCheck > 0) {
    // 등록 버튼 클릭
    const registerBtn = await p.$('button._answerRegisterButton');
    if (registerBtn) {
      await registerBtn.scrollIntoViewIfNeeded();
      await p.waitForTimeout(1000);
      await registerBtn.evaluate(el => el.click());
      await p.waitForTimeout(3000);
      console.log('✅ 등록 버튼 클릭 완료!');
    } else {
      console.log('등록 버튼을 찾을 수 없음');
    }
  }

  console.log('\n📌 브라우저에서 결과 확인해주세요.');
  
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 300)));
