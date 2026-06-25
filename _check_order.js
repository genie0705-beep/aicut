const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  
  let targetPage = null;
  for (const p of pages) {
    if (p.url().includes('PostWriteForm')) {
      await p.bringToFront();
      await p.waitForTimeout(500);
      const cnt = await p.evaluate(() => {
        const w = document.querySelector('.se-components-wrap');
        return w ? (w.innerHTML.match(/<img/gi)||[]).length : 0;
      });
      if (cnt === 5) { targetPage = p; break; }
    }
  }
  
  if (!targetPage) { console.log('Not found'); await browser.close(); return; }
  
  await targetPage.bringToFront();
  await targetPage.waitForTimeout(1000);
  
  const content = await targetPage.evaluate(() => {
    const w = document.querySelector('.se-components-wrap');
    const html = w.innerHTML;
    
    // Get text content for order check
    const text = w.innerText;
    
    // Count components
    const figures = w.querySelectorAll('figure.se-image');
    const headings = w.querySelectorAll('h1,h2,h3,h4');
    const paras = w.querySelectorAll('p');
    
    // Show component order (first 20 chars of each text block)
    const order = [];
    w.querySelectorAll(':scope > div, :scope > section').forEach(comp => {
      const t = (comp.innerText || '').trim().substring(0, 40);
      const hasImg = comp.querySelector('img') !== null;
      if (t || hasImg) {
        order.push({ 
          type: hasImg ? 'IMAGE' : 'TEXT', 
          preview: hasImg ? (comp.querySelector('img')?.alt || '[img]') : t.substring(0, 30) 
        });
      }
    });
    
    // Alternative: walk all direct children
    const components = [];
    const children = w.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const tag = child.tagName;
      const hasImg = child.querySelector('img') !== null;
      const imgCount = (child.innerHTML.match(/<img/gi)||[]).length;
      const firstText = (child.innerText || '').trim().substring(0, 40);
      const isImageComp = child.classList.contains('se-image') || hasImg || child.classList.contains('se-component');
      
      if (isImageComp || firstText) {
        components.push({
          tag: tag,
          isImage: isImageComp || hasImg,
          imgCount: imgCount,
          text: firstText.replace(/\n/g, ' ')
        });
      }
    }
    
    return {
      images: figures.length,
      headings: headings.length,
      paras: paras.length,
      textPreview: text.substring(0, 400),
      componentCount: components.length,
      componentOrder: components
    };
  });
  
  console.log('=== Component Order ===');
  content.componentOrder.forEach((c, i) => {
    console.log(`[${i+1}] ${c.isImage ? '🖼️ IMAGE' : '📝 TEXT'} ${c.tag} ${c.text.substring(0, 40)}`);
  });
  
  console.log('\n=== Headings ===');
  console.log(content.headings, 'headings,', content.paras, 'paragraphs');
  
  await targetPage.screenshot({ path: 'blog_final_order.png', fullPage: true });
  console.log('\nScreenshot saved');
  
  await browser.close();
})();
