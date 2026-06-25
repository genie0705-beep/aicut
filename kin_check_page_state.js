const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(()=>{}));
  
  const pages = ctx.pages();
  for (const p of pages) {
    if (p.url().includes('493566474')) {
      await p.bringToFront();
      await p.waitForTimeout(1000);
      
      const state = await p.evaluate(() => {
        // Check editor state
        const ed = document.querySelector('div[contenteditable="true"]');
        const editorExists = !!ed;
        const editorContent = ed ? ed.innerText.substring(0, 100) : 'none';
        
        // Check if answer registered popup exists
        const bodyText = document.body.innerText;
        
        // Check for register button
        const registerBtn = document.querySelector('button._answerRegisterButton');
        const cancelBtn = document.querySelector('button:has-text("취소")');
        
        return {
          url: window.location.href.substring(0, 100),
          editorExists,
          editorContent,
          hasRegisterBtn: !!registerBtn,
          hasCancelBtn: !!cancelBtn,
          bodyPreview: bodyText.substring(300, 800)
        };
      });
      
      console.log('=== 페이지 최종 상태 ===');
      console.log(JSON.stringify(state, null, 2));
      break;
    }
  }
  
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 200)));
