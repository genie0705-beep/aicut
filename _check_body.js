const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  
  let targetPage = null;
  for (const p of pages) {
    if (p.url().includes('PostWriteForm') && p.url().includes('blogId=aicut')) {
      targetPage = p;
      break;
    }
  }
  
  if (!targetPage) {
    console.log('No PostWriteForm tab found');
    await browser.close();
    return;
  }
  
  await targetPage.bringToFront();
  await targetPage.waitForTimeout(2000);
  
  const content = await targetPage.evaluate(() => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      // Try different methods to get body
      let html = '';
      if (ed.getBody) html = ed.getBody();
      else if (ed.body) html = typeof ed.body === 'string' ? ed.body : '';
      else if (ed.innerHTML) html = ed.innerHTML;
      
      // Try to find the content in the DOM
      const seContent = document.querySelector('.se-content, [contenteditable]');
      if (seContent) {
        html = seContent.innerHTML;
      }
      
      return {
        found: html.length > 0,
        length: html.length,
        html: html.substring(0, 2000),
        imgCount: (html.match(/<img/gi) || []).length,
        text: (seContent ? seContent.innerText : '').substring(0, 300)
      };
    } catch(e) {
      return { error: e.message };
    }
  });
  
  console.log(JSON.stringify(content, null, 2));
  
  // Take screenshot
  await targetPage.screenshot({ path: 'editor_state_now.png' });
  console.log('Screenshot saved');
  
  await browser.close();
})();
