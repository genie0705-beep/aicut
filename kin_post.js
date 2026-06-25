const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(()=>{}));
  
  // AI동영상 질문 - 답변 1개, 좋은 기회
  const url = 'https://kin.naver.com/qna/detail.naver?d1id=8&dirId=8080105&docId=493566474';
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
  await p.waitForTimeout(5000);
  
  // 답변하기 버튼 확인
  const btnInfo = await p.evaluate(() => {
    const allBtns = document.querySelectorAll('button, a, span, div[role=button]');
    const results = [];
    allBtns.forEach((el, i) => {
      const text = (el.innerText || '').trim();
      if (text.includes('답변') || text.includes('작성') || text.includes('답변하기')) {
        results.push({ idx: i, tag: el.tagName, text: text.substring(0, 30), class: (el.className || '').substring(0, 40), id: el.id });
      }
    });
    return results;
  });
  
  console.log('=== 답변 관련 버튼 ===');
  btnInfo.forEach(b => console.log(JSON.stringify(b)));
  
  // 전체 페이지에서 '답변하기' 찾기
  const allText = await p.evaluate(() => document.body.innerText);
  const hasAnswerBtn = allText.includes('답변하기');
  console.log('\n답변하기 텍스트 존재:', hasAnswerBtn);
  
  // 특정 selector로 답변하기 버튼 찾기
  const answerBtn = await p.evaluate(() => {
    // Try common selectors
    const selects = [
      '._answerWriteButtonWrapper button',
      '._answerWriteButtonWrapper a',
      '.answer_write button',
      '.area_answer button',
      '[class*=answerWrite] button',
      '.answer_button_area button',
      '.btn_answer',
      'a[href*="answerWrite"]'
    ];
    for (const sel of selects) {
      const el = document.querySelector(sel);
      if (el) return { selector: sel, text: el.innerText.substring(0, 30), tag: el.tagName, href: el.href || '' };
    }
    return null;
  });
  
  console.log('\n=== 답변하기 버튼 검색 ===');
  console.log(JSON.stringify(answerBtn, null, 2));
  
  // 내가 답변할 수 있는지 확인 - 이미 답변한 경우인지
  console.log('\n=== 내 정보 ===');
  const myInfo = await p.evaluate(() => {
    // Check if I already answered
    const answerSections = document.querySelectorAll('._answer');
    const myAnswers = [];
    answerSections.forEach((section, i) => {
      const text = section.innerText.substring(0, 100);
      if (text.includes('에이컷') || text.includes('geni')) {
        myAnswers.push(i + ': ' + text.substring(0, 80));
      }
    });
    return myAnswers;
  });
  console.log('내 답변:', myInfo);
  
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 300)));
