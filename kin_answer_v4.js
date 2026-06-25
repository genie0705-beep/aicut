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
    await p.waitForTimeout(3000);
  }
  await p.bringToFront();
  await p.waitForTimeout(1000);

  // Check for editor, if not click 답변하기 first
  let ed = await p.$('div[contenteditable="true"]');
  if (!ed) {
    const btns = await p.$$('button');
    for (const btn of btns) {
      const txt = await btn.innerText();
      if (txt.includes('답변하기')) {
        await btn.click();
        await p.waitForTimeout(3000);
        ed = await p.$('div[contenteditable="true"]');
        break;
      }
    }
  }
  
  if (!ed) { console.log('에디터 없음'); await b.close(); return; }

  // Clear existing content - first select all and delete
  await ed.click();
  await p.waitForTimeout(300);
  
  // Use keyboard to select all
  await p.keyboard.press('Control+A');
  await p.waitForTimeout(300);
  await p.keyboard.press('Delete');
  await p.waitForTimeout(500);

  // Try inserting via execCommand (this is what SE actually recognizes)
  const answerText = `안녕하세요, AI 영상 제작 관련해서 도움이 될 만한 내용 공유드립니다.

설명해주신 "위성 데이터 -> AI 분석 -> 위험 감지 -> 현장 대응" 플로우를 구현하려면 접근법이 두 가지 있습니다.

1) AI 영상 생성 툴 직접 사용
- Runway Gen-3: 이미지 업로드 후 원하는 모션을 텍스트로 입력
- Pika Labs: 이미지 기반 카메라 무빙(팬, 줌인) 세밀 지정 가능
- Kling / Vidu: 사진을 자연스럽게 움직이는 능력이 좋음
- Higgsfield: 릴스/쇼츠 형식에 최적화된 AI 영상 생성

2) 외주 의뢰
크몽에서 "AI 영상 제작" 또는 "모션그래픽"으로 검색하시고 포트폴리오 확인 후 의뢰하세요. 장면별 타임라인을 문서로 정리해서 전달하면 견적이 정확합니다.

AI 영상 툴은 대부분 무료 체험을 제공하니, 직접 테스트해보시고 결정하셔도 좋습니다.`;

  const inserted = await p.evaluate((text) => {
    const ed = document.querySelector('div[contenteditable="true"]');
    if (!ed) return false;
    
    ed.focus();
    
    // Method 1: execCommand
    const success = document.execCommand('insertText', false, text);
    
    // Also dispatch input event for SE to detect
    ed.dispatchEvent(new Event('input', { bubbles: true }));
    ed.dispatchEvent(new Event('change', { bubbles: true }));
    
    return success;
  }, answerText);
  
  console.log('insertText 결과:', inserted);
  await p.waitForTimeout(2000);
  
  // Verify content
  const contentLen = await p.evaluate(() => {
    const ed = document.querySelector('div[contenteditable="true"]');
    return ed ? ed.innerText.length : 0;
  });
  console.log('에디터 글자 수:', contentLen);
  
  // Scroll to register button and click
  await p.evaluate(() => {
    // Scroll to the bottom where register button is
    window.scrollTo(0, document.body.scrollHeight);
  });
  await p.waitForTimeout(1000);
  
  // Click register using evaluate
  const regResult = await p.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      if (btn.className.includes('_answerRegisterButton') || 
          (btn.innerText.trim() === '등록' && btn.offsetParent !== null)) {
        btn.scrollIntoView({ behavior: 'instant', block: 'center' });
        setTimeout(() => btn.click(), 100);
        return 'clicked: ' + btn.innerText + ' class=' + btn.className;
      }
    }
    return 'no button found';
  });
  
  console.log('등록:', regResult);
  await p.waitForTimeout(5000);
  
  // Final check
  const final = await p.evaluate(() => {
    const ed = document.querySelector('div[contenteditable="true"]');
    const body = document.body.innerText;
    const answerCount = (body.match(/\d+번째 답변/g) || []).length;
    return {
      editorExists: !!ed,
      answerCount: answerCount,
      hasHiggsfield: body.includes('Higgsfield'),
      hasRunway: body.includes('Runway')
    };
  });
  console.log('최종 상태:', JSON.stringify(final));
  
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 300)));
