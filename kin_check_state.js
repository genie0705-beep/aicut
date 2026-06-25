const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(()=>{}));
  
  const pages = ctx.pages();
  for (const p of pages) {
    if (p.url().includes('detail.naver') && p.url().includes('493566474')) {
      const text = await p.evaluate(() => {
        const ed = document.querySelector('div[contenteditable="true"]');
        return ed ? ed.innerText.substring(0, 500) : 'no editor found';
      });
      console.log('에디터 내용:', text.substring(0, 300));
      break;
    }
  }
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 200)));
