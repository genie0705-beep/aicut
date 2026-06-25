const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  
  let targetPage = null;
  for (const p of pages) {
    if (p.url().includes('PostWriteForm')) {
      await p.bringToFront();
      await p.waitForTimeout(500);
      const cnt = await p.evaluate(() => {
        const w = document.querySelector('.se-components-wrap');
        return w ? (w.querySelectorAll('img').length) : 0;
      });
      if (cnt >= 4) { targetPage = p; break; }
    }
  }
  
  if (!targetPage) { console.log('Not found'); process.exit(1); }
  
  await targetPage.bringToFront();
  await targetPage.waitForTimeout(2000);
  
  // Get full text of the editor
  const textContent = await targetPage.evaluate(() => {
    const w = document.querySelector('.se-components-wrap');
    return w ? w.innerText : '';
  });
  
  console.log('=== 에디터 전체 텍스트 ===');
  console.log(textContent);
  console.log('=== 끝 ===');
  
  // Get image status
  const imgStatus = await targetPage.evaluate(() => {
    const imgs = document.querySelectorAll('.se-components-wrap img');
    return {
      count: imgs.length,
      srcs: Array.from(imgs).map(i => ({ src: (i.getAttribute('src')||'').substring(0,60), alt: i.alt }))
    };
  });
  console.log('\n=== 이미지 상태 ===');
  console.log(JSON.stringify(imgStatus, null, 2));
  
  await browser.close();
})();
