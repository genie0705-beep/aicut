const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(()=>{}));
  
  const pages = ctx.pages();
  for (const p of pages) {
    if (p.url().includes('493566474')) {
      await p.bringToFront();
      await p.evaluate(() => window.scrollTo(0, 500));
      await p.waitForTimeout(2000);
      
      // Check body for our answer
      const text = await p.evaluate(() => {
        // Find answer sections
        const answers = document.querySelectorAll('._answer');
        const answerTexts = Array.from(answers).map((a, i) => 
          '답변 ' + (i+1) + ': ' + a.innerText.substring(0, 200)
        );
        return answerTexts;
      });
      
      console.log('=== 등록된 답변들 ===');
      text.forEach(t => console.log(t + '\n'));
      
      // Count answers
      console.log('총 답변 수:', text.length);
      break;
    }
  }
  
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 200)));
