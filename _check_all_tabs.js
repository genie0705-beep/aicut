const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  
  let foundTarget = null;
  
  // Check ALL PostWriteForm tabs
  for (const p of pages) {
    if (p.url().includes('PostWriteForm') && p.url().includes('blogId=aicut')) {
      console.log('Checking tab:', p.url());
      await p.bringToFront();
      await p.waitForTimeout(2000);
      
      const content = await p.evaluate(() => {
        try {
          const seContent = document.querySelector('.se-components-wrap, [contenteditable]');
          if (!seContent) return { error: 'no editor found' };
          
          const html = seContent.innerHTML || '';
          const text = seContent.innerText || '';
          return {
            textPreview: text.substring(0, 200),
            htmlLength: html.length,
            imgCount: (html.match(/<img/gi) || []).length,
            imgUrls: (html.match(/src="([^"]+)"/g) || []).map(s => s.substring(5, s.length-1).substring(0, 80))
          };
        } catch(e) {
          return { error: e.message };
        }
      });
      
      console.log('Content:', JSON.stringify(content, null, 2));
      console.log('---');
      
      if (content.imgCount > 0 || (content.textPreview && content.textPreview.length > 20)) {
        foundTarget = p;
      }
    }
  }
  
  if (foundTarget) {
    console.log('Found tab with content!');
  } else {
    console.log('No tab has images/content');
  }
  
  await browser.close();
})();
