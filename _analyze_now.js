const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const pages = b.contexts()[0].pages();
  
  // Analyze all tabs
  let editorPage = null;
  for (const p of pages) {
    console.log('Tab:', p.url().substring(0, 120));
    if (p.url().includes('PostWriteForm')) {
      editorPage = p;
      await p.bringToFront();
      await p.waitForTimeout(1500);
      
      const state = await p.evaluate(() => {
        const w = document.querySelector('.se-content');
        const text = w ? w.innerText : '';
        const imgs = w ? w.querySelectorAll('img').length : 0;
        const titleEl = document.querySelector('.se-documentTitle');
        const title = titleEl ? titleEl.innerText.trim().substring(0, 50) : '';
        
        // Find all buttons
        const btns = Array.from(document.querySelectorAll('button')).map(b => ({
          text: (b.innerText || '').trim().substring(0, 15),
          visible: b.getBoundingClientRect().width > 0
        })).filter(b => b.visible);
        
        return {
          title,
          textLength: text.length,
          bodyPreview: text.substring(0, 100),
          images: imgs,
          hasPlaceholder: text.includes('나를 돌아보는') || text.includes('추가할 컴포넌트'),
          buttons: btns.map(b => b.text).join(', ')
        };
      });
      
      console.log('\n=== 에디터 상태 ===');
      console.log(JSON.stringify(state, null, 2));
    }
  }
  
  await b.close();
})();
