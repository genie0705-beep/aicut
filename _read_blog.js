const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  
  // Read the blog post
  await page.goto('https://blog.naver.com/aicut/224321249534', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  // Get the post content
  const text = await page.evaluate(() => {
    // Naver blog uses iframes for content
    const frames = document.querySelectorAll('iframe');
    let content = '';
    
    // Try main frame
    const mainFrame = document.querySelector('#mainFrame');
    if (mainFrame) {
      console.log('Found mainFrame');
    }
    
    // Get visible text
    content = document.body.innerText;
    
    // Also try the se-main-content
    const seContent = document.querySelector('.se-main-content');
    if (seContent) {
      content = seContent.innerText;
    }
    
    return content.substring(0, 3000);
  });
  
  console.log('=== 블로그 포스트 내용 ===');
  console.log(text);
  
  await browser.close();
})();
