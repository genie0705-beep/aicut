const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const pages = b.contexts()[0].pages();
  let ig;
  for (const p of pages) { if (p.url().includes('instagram')) { ig = p; break; } }
  if (!ig) { console.log('no ig'); await b.close(); return; }
  
  await ig.bringToFront();
  await ig.waitForTimeout(2000);
  
  console.log('Title:', await ig.title());
  
  // Check current state - find all buttons  
  const btns = await ig.evaluate(() => {
    const result = [];
    document.querySelectorAll('div[role="button"], button').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width > 10 && r.height > 10) {
        const t = (el.innerText || '').trim();
        if (t) result.push({ text: t.substring(0,20), x: Math.round(r.x+r.width/2), y: Math.round(r.y+r.height/2) });
      }
    });
    return result;
  });
  
  console.log('Buttons:', btns.map(b => b.text).join(', '));
  
  // Try to share
  const shareBtn = btns.find(b => b.text === '공유' || b.text === 'Share');
  
  if (shareBtn) {
    console.log(`Clicking "${shareBtn.text}" at (${shareBtn.x}, ${shareBtn.y})`);
    await ig.mouse.click(shareBtn.x, shareBtn.y);
    await ig.waitForTimeout(5000);
    
    const newTitle = await ig.title();
    const newUrl = ig.url();
    console.log('After share - URL:', newUrl);
    console.log('After share - Title:', newTitle);
    
    if (newUrl.includes('/p/')) {
      console.log('🎉 게시물 발행 완료!');
    } else {
      // Maybe need to click share one more time for confirmation
      console.log('Retrying share...');
      const btns2 = await ig.evaluate(() => {
        const r = [];
        document.querySelectorAll('div[role="button"], button').forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.width > 10 && rect.height > 10) {
            const t = (el.innerText || '').trim();
            if (t) r.push({ text: t.substring(0,20), x: Math.round(rect.x+rect.width/2), y: Math.round(rect.y+rect.height/2) });
          }
        });
        return r;
      });
      const share2 = btns2.find(b => b.text === '공유');
      if (share2) {
        await ig.mouse.click(share2.x, share2.y);
        await ig.waitForTimeout(5000);
        const t2 = await ig.title();
        const u2 = ig.url();
        console.log('After 2nd share:', t2, u2.substring(0,100));
      }
    }
  } else {
    console.log('No 공유 button - checking if already on feed');
    const text = await ig.evaluate(() => document.body.innerText.substring(0, 300));
    console.log('Page text:', text);
  }
  
  await ig.screenshot({ path: 'ig_share_done.png' });
  console.log('Screenshot saved');
  
  await b.close();
})();
