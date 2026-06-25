const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);
  
  // Take screenshot of full page
  await page.screenshot({ path: 'editor_full.png', fullPage: true });
  
  // Look for ALL buttons and their positions
  const btns = await page.evaluate(() => {
    const data = [];
    const allBtns = document.querySelectorAll('button, [role="button"], [tabindex]:not([tabindex="-1"])');
    allBtns.forEach((b, i) => {
      const rect = b.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const text = (b.innerText || '').trim().substring(0,20);
        const cls = (b.className || '').substring(0,40);
        if (text || cls.includes('image') || cls.includes('photo') || cls.includes('file')) {
          data.push({
            text: text,
            idx: i,
            x: Math.round(rect.x), y: Math.round(rect.y),
            w: Math.round(rect.width), h: Math.round(rect.height),
            tag: b.tagName,
            cls: cls
          });
        }
      }
    });
    return data.sort((a,b) => a.y - b.y || a.x - b.x);
  });
  
  console.log('=== VISIBLE BUTTONS ===');
  btns.forEach(b => console.log(`(${b.x},${b.y} ${b.w}x${b.h}) ${b.text || '[icon]'} tag=${b.tag} cls=${b.cls}`));
  
  // Also check if there are file inputs visible or hidden
  const inputs = await page.evaluate(() => {
    const data = [];
    const allInputs = document.querySelectorAll('input');
    allInputs.forEach((el, i) => {
      data.push({
        id: el.id, type: el.type, accept: el.accept,
        visible: el.offsetHeight > 0,
        placeholder: (el.placeholder || '').substring(0,20),
        rect: el.getBoundingClientRect()
      });
    });
    return data;
  });
  console.log('\n=== ALL INPUTS ===');
  inputs.forEach(i => console.log(`type=${i.type} id=${i.id} accept=${i.accept} visible=${i.visible} placeholder=${i.placeholder}`));
  
  await browser.close();
})();
