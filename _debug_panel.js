const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);
  
  // Click 사진 button
  const btnPos = await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if ((btn.innerText || '').trim().startsWith('사진')) {
        const r = btn.getBoundingClientRect();
        return { x: r.x + r.width/2, y: r.y + r.height/2 };
      }
    }
    return null;
  });
  
  if (btnPos) {
    await page.mouse.click(btnPos.x, btnPos.y);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'panel_screenshot.png' });
    
    // Get ALL clickable elements on the right side
    const elements = await page.evaluate(() => {
      const result = [];
      const all = document.querySelectorAll('*');
      for (const el of all) {
        const r = el.getBoundingClientRect();
        if (r.width > 10 && r.height > 10 && r.x > 1300) {
          const text = (el.innerText || '').trim();
          if (text && text.length < 100) {
            result.push({
              tag: el.tagName,
              text: text.substring(0, 40),
              x: Math.round(r.x),
              y: Math.round(r.y),
              w: Math.round(r.width),
              h: Math.round(r.height)
            });
          }
        }
      }
      return result;
    });
    
    console.log('=== Right side elements with text ===');
    elements.forEach(e => console.log(JSON.stringify(e)));
    
    // Check for any file input
    const hasFileInput = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      return Array.from(inputs).map(i => ({
        type: i.type,
        id: i.id,
        accept: i.accept,
        visible: i.offsetHeight > 0,
        style: (i.getAttribute('style') || '').substring(0, 100)
      }));
    });
    console.log('\n=== All inputs ===');
    hasFileInput.forEach(i => console.log(JSON.stringify(i)));
  }
  
  await browser.close();
})();
