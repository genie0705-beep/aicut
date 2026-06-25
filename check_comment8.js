const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const page = await browser.contexts()[0].newPage();
  page.on('dialog', async d => await d.dismiss().catch(() => {}));
  
  await page.goto('https://blog.naver.com/lg4600/224271601694', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(6000);
  
  const frames = page.frames();
  console.log('Total frames:', frames.length);
  
  // Just find comment-related frames and print their info
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    const url = f.url();
    
    if (url.includes('Comment') || url.includes('comment') || url.includes('blogId')) {
      console.log(`\nFrame ${i}: ${url.substring(0, 200)}`);
      
      try {
        const info = await f.evaluate(() => {
          // Check for textarea
          const ta = document.querySelector('textarea');
          // Check for contenteditable
          const ce = document.querySelector('[contenteditable]');
          // Check for form
          const form = document.querySelector('form');
          // Check for input
          const inputs = document.querySelectorAll('input');
          
          const results = {};
          if (ta) results.textarea = { placeholder: ta.placeholder, id: ta.id, className: ta.className.substring(0, 60) };
          if (ce) results.contentEditable = { id: ce.id, className: ce.className.substring(0, 60) };
          if (form) results.hasForm = true;
          if (inputs.length > 0) results.inputs = Array.from(inputs).slice(0, 3).map(i => ({ type: i.type, placeholder: i.placeholder, id: i.id }));
          
          const buttons = Array.from(document.querySelectorAll('button')).map(b => ({ text: b.textContent.trim().substring(0, 20), className: b.className.substring(0, 40) }));
          if (buttons.length > 0) results.buttons = buttons;
          
          results.textSnippet = (document.body?.innerText || '').substring(0, 300);
          return results;
        });
        console.log(JSON.stringify(info, null, 2));
      } catch(e) {
        console.log(`  Error: ${e.message.substring(0, 80)}`);
      }
    }
  }
  
  await page.close().catch(() => {});
  await browser.close();
})().catch(e => console.error('Error:', e.message));
