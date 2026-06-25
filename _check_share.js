const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const pages = b.contexts()[0].pages();
  let ig;
  for (const p of pages) { if (p.url().includes('instagram')) { ig = p; break; } }
  if (!ig) { console.log('no ig'); await b.close(); return; }
  
  await ig.bringToFront();
  await ig.waitForTimeout(2000);
  
  const url = ig.url();
  console.log('URL:', url);
  console.log('Title:', await ig.title());
  
  // Check all buttons for "공유" or "Share"
  const shareBtns = await ig.evaluate(() => {
    const result = [];
    document.querySelectorAll('div[role="button"], button').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width > 10 && r.height > 10) {
        const t = (el.innerText || '').trim();
        if (t === '공유' || t === 'Share' || t === '다음' || t === '게시물') {
          result.push({ text: t, x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) });
        }
      }
    });
    return result;
  });
  
  if (shareBtns.length > 0) {
    console.log('Buttons found:', shareBtns.map(b => `${b.text}(${b.x},${b.y})`).join(', '));
    
    // Try clicking "공유" first
    const share = shareBtns.find(b => b.text === '공유');
    if (share) {
      console.log('Clicking 공유...');
      await ig.mouse.click(share.x, share.y);
      await ig.waitForTimeout(5000);
      
      const afterUrl = ig.url();
      console.log('After share URL:', afterUrl);
      console.log('After share Title:', await ig.title());
      
      await ig.screenshot({ path: 'ig_after_share_retry.png' });
      
      if (afterUrl.includes('/p/')) {
        console.log('✅ 게시물 발행 완료!');
      } else {
        console.log('⚠️ 발행 상태 확인 필요');
      }
    } else {
      console.log('No 공유 button, checking if already published');
    }
  } else {
    console.log('No action buttons - checking current state');
  }
  
  await ig.screenshot({ path: 'ig_state_check.png' });
  
  await b.close();
})();
