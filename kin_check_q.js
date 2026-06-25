const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(()=>{}));
  
  // Check specific question pages
  const urls = [
    'https://kin.naver.com/qna/detail.naver?d1id=10&dirId=10010102&docId=493736600',  // 결혼식 오프닝 영상
    'https://kin.naver.com/qna/detail.naver?d1id=8&dirId=8080105&docId=493566474',     // 사진을 AI동영상으로
    'https://kin.naver.com/qna/detail.naver?d1id=1&dirId=1061203&docId=491943585',     // 인스타 릴스 학원 광고
    'https://kin.naver.com/qna/detail.naver?d1id=11&dirId=110405&docId=493841947',     // 이 곡 이름 - unanswered
    'https://kin.naver.com/qna/detail.naver?d1id=3&dirId=31402&docId=493820187',       // 홈런 영상 숏폼 - unanswered
  ];
  
  for (const url of urls) {
    const p = await ctx.newPage();
    await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await p.waitForTimeout(3000);
    
    const info = await p.evaluate(() => {
      // 질문 제목, 내용, 답변 수 확인
      const title = document.querySelector('.title, .question-title, h3, h2')?.innerText?.trim().substring(0, 80) || '?';
      const content = document.querySelector('.content, .question-content, .c-content')?.innerText?.trim().substring(0, 200) || document.body.innerText.substring(0, 200);
      
      // 답변 개수 확인
      const bodyText = document.body.innerText;
      const hasAnswer = bodyText.includes('답변') && (bodyText.includes('채택') || bodyText.includes('답변채택'));
      
      return { title, content: content.substring(0, 150), hasAnswer };
    });
    
    console.log('\n=== 질문 ===');
    console.log('제목:', info.title);
    console.log('내용:', info.content);
    console.log('답변있음:', info.hasAnswer);
    
    await p.close();
  }
  
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 300)));
