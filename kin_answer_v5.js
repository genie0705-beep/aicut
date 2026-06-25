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
    await p.goto('https://kin.naver.com/qna/detail.naver?d1id=8&dirId=8080105&docId=493566474');
    await p.waitForTimeout(4000);
  }
  await p.bringToFront();

  // Click 답변하기 via evaluate, click register via evaluate
  const result = await p.evaluate(async () => {
    // 1. Check if editor is already open
    let ed = document.querySelector('div[contenteditable="true"]');
    
    if (!ed) {
      // Find and click 답변하기 or 답변 button
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        if (btn.innerText.includes('답변하기') || btn.innerText.trim() === '답변') {
          btn.click();
          break;
        }
      }
      // Wait for editor to appear
      await new Promise(r => setTimeout(r, 3000));
      ed = document.querySelector('div[contenteditable="true"]');
    }
    
    if (!ed) return 'no editor found';
    
    // 2. Focus and clear editor
    ed.focus();
    
    // Try to use the SE editor's internal API (SmartEditor2)
    // Check if window.SmartEditor has an instance
    // The SE editor stores its content in a specific way
    
    // Clear existing content
    ed.innerHTML = '';
    
    // Insert text paragraph by paragraph using execCommand
    const text = `안녕하세요, AI 영상 제작 관련해서 도움이 될 만한 내용 공유드립니다.

설명해주신 "위성 데이터 -> AI 분석 -> 위험 감지 -> 현장 대응" 플로우를 구현하려면 접근법이 두 가지 있습니다.

1) AI 영상 생성 툴 직접 사용
- Runway Gen-3: 이미지 업로드 후 원하는 모션을 텍스트로 입력
- Pika Labs: 이미지 기반 카메라 무빙(팬, 줌인) 세밀 지정
- Kling / Vidu: 사진을 자연스럽게 움직이는 능력이 좋음

2) 외주 의뢰
크몽에서 "AI 영상 제작" 또는 "모션그래픽"으로 검색, 포트폴리오 확인 후 의뢰하세요.

AI 영상 툴은 대부분 무료 체험을 제공하니 직접 테스트해보시고 결정하셔도 좋습니다.`;
    
    // Set content using innerHTML with proper paragraph tags
    const paragraphs = text.split('\n\n').filter(p => p.trim());
    const htmlContent = paragraphs.map(p => '<p>' + p.replace(/\n/g, '<br>') + '</p>').join('');
    
    ed.innerHTML = htmlContent;
    ed.dispatchEvent(new Event('input', { bubbles: true }));
    
    console.log('Content set:', ed.innerText.length, 'chars');
    
    // 3. Try to sync with SE via __se_editor_jsonp or direct method
    // SE2 usually autodetects changes via input events
    
    await new Promise(r => setTimeout(r, 1500));
    
    // 4. Scroll down to find register button
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise(r => setTimeout(r, 1000));
    
    // 5. Click register button
    const allButtons = document.querySelectorAll('button');
    let registerClicked = false;
    for (const btn of allButtons) {
      const txt = btn.innerText.trim();
      const cls = btn.className;
      if (txt === '등록' || cls.includes('_answerRegisterButton')) {
        btn.scrollIntoView({ block: 'center' });
        await new Promise(r => setTimeout(r, 500));
        btn.click();
        registerClicked = true;
        console.log('Register button clicked');
        break;
      }
    }
    
    if (!registerClicked) return 'register button not found';
    
    // 6. Wait for submission
    await new Promise(r => setTimeout(r, 4000));
    
    // 7. Check result
    const editorAfter = document.querySelector('div[contenteditable="true"]');
    const bodyText = document.body.innerText;
    const answerCount = (bodyText.match(/\d+번째 답변/g) || []).length;
    
    return {
      editorGone: !editorAfter,
      answerCount: answerCount,
      hasContent: bodyText.includes('Runway') || bodyText.includes('Pika')
    };
  });
  
  console.log('결과:', JSON.stringify(result, null, 2));
  await p.waitForTimeout(2000);
  
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 300)));
