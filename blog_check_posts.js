const { chromium } = require('playwright');

const logNos = ['224315585369', '224315539820', '224312026671', '224303576820', '224302878663'];

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  
  for (const logNo of logNos) {
    const page = await ctx.newPage();
    try {
      await page.goto('https://blog.naver.com/PostView.naver?blogId=aicut&logNo=' + logNo, { 
        waitUntil: 'domcontentloaded', timeout: 10000 
      });
      await page.waitForTimeout(2000);
      
      const frame = page.frame({ name: 'mainFrame' });
      let title = '';
      if (frame) {
        title = await frame.evaluate(() => {
          const seTitle = document.querySelector('.se-title-text');
          if (seTitle) return seTitle.innerText.substring(0, 60);
          const h2 = document.querySelector('h2');
          if (h2) return h2.innerText.substring(0, 60);
          return document.title.substring(0, 60);
        });
      } else {
        title = await page.title();
      }
      console.log('[' + logNo + '] ' + (title || '제목 없음'));
      
    } catch(e) {
      console.log('[' + logNo + '] ERROR: ' + (e.message || '').substring(0, 50));
    }
    await page.close();
  }
  
  await b.close();
})();
