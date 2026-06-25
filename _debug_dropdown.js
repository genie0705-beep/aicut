const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'before_click.png' });
  
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
    console.log('사진 button at:', btnPos.x, btnPos.y);
    await page.mouse.click(btnPos.x, btnPos.y);
    await page.waitForTimeout(3000);
    
    // Check for elements visible near the button area (dropdown panel)
    const nearElements = await page.evaluate(() => {
      const result = [];
      const all = document.querySelectorAll('div, section, ul, li, span, button');
      for (const el of all) {
        const r = el.getBoundingClientRect();
        // Look for elements that appeared within 0-400px x, 100-400px y
        if (r.width > 20 && r.height > 20 && r.x < 400 && r.y > 100 && r.y < 600) {
          const text = (el.innerText || '').trim();
          if (text) {
            result.push({
              tag: el.tagName,
              text: text.substring(0, 50),
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
    
    console.log('=== Elements near button (dropdown area) ===');
    nearElements.forEach(e => console.log(JSON.stringify(e)));
    
    await page.screenshot({ path: 'after_click_dropdown.png' });
    
    // Try clicking directly at (36, 110) - right below the 사진 button where dropdown might be
    // to click the first option in a potential dropdown
    const clickOptions = [
      { x: 36, y: 110 }, // directly below button
      { x: 36, y: 130 },
      { x: 36, y: 150 },
      { x: 36, y: 170 },
    ];
    
    for (const pos of clickOptions) {
      const fcPromise = page.waitForEvent('filechooser', { timeout: 3000 }).catch(() => null);
      await page.mouse.click(pos.x, pos.y);
      await page.waitForTimeout(1000);
      const fc = await fcPromise;
      if (fc) {
        console.log('✅ Filechooser found at click:', pos.x, pos.y);
        await fc.setFiles('C:\\Users\\paul\\.openclaw\\workspace\\aicut_blog_freelancer_thumb.png');
        await page.waitForTimeout(2000);
        console.log('Image uploaded!');
        break;
      }
    }
    
    // Check for file inputs that might appear after interactions
    const fileInputs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('input[type="file"]')).map(i => ({
        id: i.id,
        accept: i.accept,
        visible: i.offsetHeight > 0,
        rect: { x: i.getBoundingClientRect().x, y: i.getBoundingClientRect().y, w: i.getBoundingClientRect().width, h: i.getBoundingClientRect().height }
      }));
    });
    console.log('\n=== File inputs after clicks ===');
    fileInputs.forEach(i => console.log(JSON.stringify(i)));
    
    await page.screenshot({ path: 'after_clicks.png' });
  }
  
  await browser.close();
})();
