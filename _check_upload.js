const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  
  await page.goto('https://blog.naver.com/PostWrite.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);
  
  const result = await page.evaluate(() => {
    const data = [];
    
    // File inputs
    const fileInputs = document.querySelectorAll('input[type="file"]');
    data.push('=== FILE INPUTS ===');
    fileInputs.forEach((el, i) => {
      data.push(JSON.stringify({
        id: el.id, className: el.className.substring(0,60),
        accept: el.accept, hidden: el.hidden || el.offsetHeight === 0
      }));
    });
    
    // IFRAMES
    const frames = document.querySelectorAll('iframe');
    data.push('=== IFRAMES ===');
    frames.forEach((f, i) => {
      data.push(`[${i}] id=${f.id} name=${f.name}`);
    });
    
    // Look inside mainFrame iframe for file inputs
    const mf = document.getElementById('mainFrame') || frames[0];
    data.push('=== MainFrame src ===');
    data.push(mf?.src || 'none');
    
    return data.join('\n');
  });
  
  console.log(result);
  
  // Also look inside iframe
  const frame = page.frame({ name: 'mainFrame' });
  if (frame) {
    const frameData = await frame.evaluate(() => {
      const data = [];
      const fileInputs = document.querySelectorAll('input[type="file"]');
      data.push('=== FRAME FILE INPUTS ===');
      fileInputs.forEach(el => {
        data.push(JSON.stringify({id: el.id, cls: el.className.substring(0,60), accept: el.accept, hidden: el.hidden || el.offsetHeight===0}));
      });
      
      // Image buttons
      const buttons = document.querySelectorAll('button');
      data.push('=== FRAME BUTTONS (image/photo) ===');
      buttons.forEach(b => {
        const txt = (b.innerText || '').trim();
        const cls = b.className || '';
        const title = b.getAttribute('title') || '';
        if (txt.includes('사진') || txt.includes('이미지') || cls.includes('image') || cls.includes('photo') || title.includes('사진')) {
          data.push(JSON.stringify({text: txt.substring(0,30), cls: cls.substring(0,60), title: title.substring(0,40)}));
        }
      });
      
      // Check toolbar
      const toolbar = document.querySelector('.se-toolbar');
      data.push('=== TOOLBAR ===');
      data.push(toolbar ? 'found' : 'not found');
      if (toolbar) {
        const btns = toolbar.querySelectorAll('button');
        btns.forEach(b => {
          data.push(JSON.stringify({title: b.getAttribute('title'), cls: b.className.substring(0,40)}));
        });
      }
      
      return data.join('\n');
    });
    console.log(frameData);
  }
  
  await browser.close();
})();
