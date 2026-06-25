const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const pages = browser.contexts()[0].pages();
  const anyPage = await browser.contexts()[0].newPage();
  
  await anyPage.goto('https://blog.naver.com/lg4600', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await anyPage.waitForTimeout(5000);
  
  // Check each frame for neighbor-related buttons
  const frames = anyPage.frames();
  console.log(`Frames: ${frames.length}`);
  
  for (let i = 1; i < frames.length; i++) {
    const f = frames[i];
    const url = f.url();
    console.log(`\n--- Frame ${i}: ${url.substring(0, 150)} ---`);
    
    try {
      const text = await f.evaluate(() => document.body?.innerText || '');
      const neighborText = text.split('\n').filter(t => t.includes('이웃') || t.includes('추가') || t.includes('구독') || t.includes('팔로우'));
      if (neighborText.length > 0) {
        console.log('Neighbor-related text:', neighborText.slice(0, 5));
      }
      
      // Find buttons
      const btns = await f.evaluate(() => {
        return Array.from(document.querySelectorAll('button, a, span')).filter(el => {
          const t = el.textContent?.trim() || '';
          const c = el.className || '';
          return (t.includes('이웃') || t.includes('추가') || t.includes('구독') || 
                  c.toLowerCase().includes('neighbor') || c.toLowerCase().includes('buddy')) &&
                 el.offsetParent !== null;
        }).map(el => ({
          tag: el.tagName,
          text: el.textContent?.trim()?.substring(0, 30),
          cls: el.className?.substring(0, 60),
          y: Math.round(el.getBoundingClientRect().y)
        }));
      });
      
      if (btns.length > 0) {
        console.log('Found buttons:', btns);
      } else {
        // Print all text in frame
        const allText = await f.evaluate(() => document.body?.innerText?.substring(0, 500) || 'Frame empty');
        if (allText.trim().length > 0 && allText !== 'Frame empty') {
          console.log('Frame text:', allText.replace(/\n/g, ' / ').substring(0, 300));
        }
      }
    } catch(e) {
      console.log(`  Error accessing frame: ${e.message.substring(0, 60)}`);
    }
  }
  
  await anyPage.close().catch(() => {});
  await browser.close();
})().catch(e => console.error('Error:', e.message));
