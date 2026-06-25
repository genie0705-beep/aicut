const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(()=>{}));

  const pages = ctx.pages();
  let p = null;
  // find existing kin detail page or create new page
  for (const pg of pages) {
    if (pg.url().includes('kin.naver.com')) { p = pg; break; }
  }
  if (!p) p = await ctx.newPage();

  // AI 동영상 질문 - 답변하기
  await p.goto('https://kin.naver.com/qna/detail.naver?d1id=8&dirId=8080105&docId=493566474', { waitUntil: 'networkidle', timeout: 20000 });
  await p.waitForTimeout(3000);
  
  console.log('1. 페이지 로드 완료:', p.url().substring(0, 80));

  // 답변하기 버튼 클릭 (bottom button)
  const btns = await p.$$('button');
  let clicked = false;
  for (const btn of btns) {
    const text = await btn.innerText();
    if (text.includes('답변하기')) {
      await btn.scrollIntoViewIfNeeded();
      await p.waitForTimeout(500);
      await btn.click();
      console.log('2. 답변하기 버튼 클릭됨');
      clicked = true;
      break;
    }
  }
  if (!clicked) {
    // try the other 답변 button
    for (const btn of btns) {
      const text = await btn.innerText();
      if (text.trim() === '답변') {
        await btn.scrollIntoViewIfNeeded();
        await p.waitForTimeout(500);
        await btn.click();
        console.log('2. "답변" 버튼 클릭됨');
        clicked = true;
        break;
      }
    }
  }

  if (!clicked) { console.log('답변 버튼 클릭 실패'); await b.close(); return; }
  
  await p.waitForTimeout(5000);

  // 에디터 확인
  const hasEditor = await p.evaluate(() => {
    const editors = document.querySelectorAll('div[contenteditable="true"], textarea, iframe.se_content_frame, iframe[name=content]');
    return editors.length > 0 ? Array.from(editors).map(e => e.tagName + ' ' + (e.id || '') + ' ' + (e.className || '').substring(0, 30)) : [];
  });
  console.log('3. 에디터 발견:', hasEditor);

  // contenteditable div 찾아서 입력
  const answerText = `안녕하세요, AI 영상 제작 관련해서 도움이 될 만한 내용 공유드립니다.

설명해주신 "위성 데이터가 층층이 쌓이고 → AI 분석 → 위험 감지 → 현장 대응" 플로우를 구현하려면 접근법이 두 가지 있습니다.

**1) AI 영상 생성 툴 직접 사용**
- Runway Gen-3: 이미지를 업로드하고 원하는 모션을 텍스트로 입력하면 생성됩니다. "데이터가 아래에서 위로 쌓이는" 장면을 프롬프트로 만들 수 있어요.
- Pika Labs: 이미지 기반으로 카메라 무빙(위로 팬, 줌인)을 세밀하게 지정할 수 있어서 말씀하신 연출에 잘 맞습니다.
- Kling / Vidu: 최근 퀄리티가 많이 올라왔고, 사진을 자연스럽게 움직이는 능력이 좋습니다.

**2) 외주 의뢰**
원하는 연출이 구체적이고 정밀하다면 AI 툴을 다루는 전문가에게 맡기는 게 결과물이 좋습니다. 크몽에서 "AI 영상 제작" 또는 "모션그래픽"으로 검색하시고, 포트폴리오를 꼭 확인해보세요. 의뢰 시 설명해주신 장면별 타임라인을 문서로 정리해서 전달하면 견적과 만족도 모두 높아집니다.

AI 영상 툴은 대부분 무료 체험을 제공하니, 직접 테스트해보시고 결정하시는 것도 추천드립니다.`;

  const editorDiv = await p.$('div[contenteditable="true"]');
  if (editorDiv) {
    await editorDiv.click();
    await p.waitForTimeout(1000);
    await editorDiv.fill(answerText);
    await p.waitForTimeout(1000);
    console.log('4. 답변 입력 완료 (' + answerText.length + '자)');
    
    // 등록 버튼 찾기
    const allBtns2 = await p.$$('button');
    for (const btn of allBtns2) {
      const t = await btn.innerText().catch(() => '');
      if (t.includes('등록')) {
        console.log('5. 등록 버튼 발견:', t.substring(0, 20));
        await btn.scrollIntoViewIfNeeded();
        await p.waitForTimeout(1000);
        await btn.click();
        await p.waitForTimeout(3000);
        console.log('6. 등록 버튼 클릭 완료!');
        break;
      }
    }
  } else {
    console.log('에디터 div를 찾을 수 없습니다.');
    console.log('페이지 HTML 구조 확인중...');
    const html = await p.evaluate(() => {
      const answerSec = document.querySelector('._answerWriteButtonWrapper');
      return answerSec ? answerSec.innerHTML.substring(0, 500) : 'no answer section';
    });
    console.log('답변 영역 HTML:', html);
  }

  // 결과 확인
  await p.waitForTimeout(2000);
  console.log('\n✅ 작업 완료. 브라우저에서 결과를 확인해주세요.');
  
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 300)));
