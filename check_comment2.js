const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const page = await browser.contexts()[0].newPage();
  
  // Try accessing the AICUT blog which we control - check its structure
  await page.goto('https://blog.naver.com/PostView.naver?blogId=aicut&logNo=223738510723', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(4000);
  
  console.log('URL:', page.url());
  
  // Find the comment iframe
  const frames = page.frames();
  console.log(`Frames: ${frames.length}`);
  
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    const url = f.url();
    if (url.includes('Comment') || url.includes('comment') || url.includes('blog.naver.com')) {
      console.log(`\nFrame ${i}: ${url.substring(0, 200)}`);
      try {
        const text = await f.evaluate(() => document.body?.innerText?.substring(0, 1000) || '');
        console.log('Text:', text.replace(/\n/g, ' / ').substring(0, 300));
        
        // Find inputs
        const inputs = await f.evaluate(() => {
          const all = document.querySelectorAll('textarea, input[type="text"], div[contenteditable], textarea');
          return Array.from(all).filter(el => el.offsetParent !== null).map(el => ({
            tag: el.tagName,
            type: el.type || '',
            placeholder: (el.placeholder || '').substring(0, 40),
            id: (el.id || '').substring(0, 30),
            class: (el.className || '').substring(0, 50)
          }));
        });
        
        console.log('Inputs:', JSON.stringify(inputs, null, 2));
        
        // Find buttons
        const btns = await f.evaluate(() => {
          return Array.from(document.querySelectorAll('button, a, input[type="submit"], input[type="button"]'))
            .filter(el => el.offsetParent !== null)
            .map(el => ({
              tag: el.tagName,
              text: (el.textContent?.trim() || el.value || '').substring(0, 30),
              id: (el.id || '').substring(0, 30),
              class: (el.className || '').substring(0, 50)
            }));
        });
        
        const relevantBtns = btns.filter(b => b.text.includes('등록') || b.text.includes('취소') || b.text.includes('댓글') || b.text.includes('글') || b.text.includes('입력'));
        if (relevantBtns.length > 0) {
          console.log('Buttons:', JSON.stringify(relevantBtns, null, 2));
        } else {
          console.log('All buttons:', JSON.stringify(btns, null, 2));
        }
      } catch(e) {
        console.log(`  Error: ${e.message.substring(0, 60)}`);
      }
    }
  }
  
  await page.close().catch(() => {});
  await browser.close();
})().catch(e => console.error('Error:', e.message));
