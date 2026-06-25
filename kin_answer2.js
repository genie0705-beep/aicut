const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(()=>{}));

  // 질문: "영상 자막 이런 박스모양으로 하는법" - 영상편집 팁 질문
  const qUrl = 'https://kin.naver.com/qna/detail.naver?d1id=3&dirId=3031003&docId=493843093';
  
  // First check if this question exists and its content
  const p = await ctx.newPage();
  await p.goto(qUrl, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await p.waitForTimeout(4000);
  
  const qInfo = await p.evaluate(() => {
    const content = document.querySelector('#content');
    return content ? content.innerText.substring(0, 300) : document.body.innerText.substring(0, 300);
  });
  console.log('질문 내용:', qInfo.substring(0, 200));
  
  // Check if it has an answer button and no existing answer from us
  const hasEditor = await p.$('div[contenteditable="true"]');
  
  if (hasEditor) {
    // Use same method as before
    await p.evaluate(() => {
      const editor = SmartEditor._editors['kinpc001'];
      if (!editor) return;
      
      const ed = document.querySelector('div[contenteditable="true"]');
      if (ed) ed.focus();
      
      document.execCommand('selectAll');
      document.execCommand('delete');
      
      // Check what the question is about
      const content = document.querySelector('#content');
      const questionDetail = content ? content.innerText : '';
      console.log('Q:', questionDetail.substring(0, 100));
    });
  } else {
    // Click 답변하기 
    await p.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        if (btn.innerText.includes('답변하기') || btn.innerText.trim() === '답변') {
          btn.click(); break;
        }
      }
    });
    await p.waitForTimeout(4000);
  }
  
  // Now I need to adapt the answer based on the actual question
  // Let me read the question more carefully
  const questionText = await p.evaluate(() => {
    const content = document.querySelector('#content');
    return content ? content.innerText : document.body.innerText.substring(300, 1000);
  });
  
  console.log('=== 질문 전문 ===');
  console.log(questionText.substring(0, 500));
  
  await p.close();
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 300)));
