const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  
  let targetPage = null;
  for (const p of pages) {
    if (p.url().includes('PostWriteForm')) {
      await p.bringToFront();
      await p.waitForTimeout(300);
      const cnt = await p.evaluate(() => document.querySelectorAll('.se-components-wrap img')?.length || 0);
      if (cnt >= 4) { targetPage = p; break; }
    }
  }
  
  if (!targetPage) { console.log('Not found'); process.exit(1); }
  
  await targetPage.bringToFront();
  await targetPage.waitForTimeout(2000);
  
  // Direct DOM approach - find and replace the wrong text directly
  const result = await targetPage.evaluate(() => {
    const results = [];
    
    // Find the se-content element
    const content = document.querySelector('.se-content.__se-scroll-target');
    if (content) {
      results.push('Found se-content');
      
      // Get children - we need to find text components vs image components
      const children = content.children;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const isImage = child.querySelector('img') !== null;
        const text = (child.innerText || '').trim().substring(0, 40);
        const cls = child.className || '';
        const tag = child.tagName;
        const isTitle = cls.includes('documentTitle') || tag.toLowerCase() === 'h1';
        
        results.push(`[${i}] ${isTitle ? 'TITLE' : isImage ? 'IMAGE' : 'TEXT'} cls=${cls.substring(0,40)} text="${text}"`);
      }
      
      // For text components, we need to replace their innerHTML with actual text
      let textComponents = 0;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const isImage = child.querySelector('img') !== null;
        const isTitle = child.classList.contains('documentTitle') || child.tagName.toLowerCase() === 'h1';
        
        if (!isImage && !isTitle) {
          // This is a text component with raw HTML
          const section = child.querySelector('.se-section-text .se-module-text') || 
                          child.querySelector('[contenteditable]') ||
                          child;
          if (section) {
            const raw = section.innerHTML || '';
            // Check if it contains raw HTML tags
            if (raw.includes('&lt;p') || raw.includes('&lt;h') || raw.includes('<p ') || raw.includes('&lt;strong')) {
              // Replace the decoded HTML entities with actual HTML
              const decoded = raw
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&amp;/g, '&');
              
              section.innerHTML = decoded;
              textComponents++;
            }
          }
        }
      }
      
      results.push(`Fixed ${textComponents} text components`);
      return results.join('\n');
    }
    
    return 'se-content not found';
  });
  
  console.log(result);
  
  // Check result
  const finalCheck = await targetPage.evaluate(() => {
    const w = document.querySelector('.se-content.__se-scroll-target');
    return {
      text: (w ? w.innerText : '').substring(0, 500),
      hasHTMLtags: (w ? w.innerText : '').includes('<p') || (w ? w.innerText : '').includes('<h2'),
      imgCount: document.querySelectorAll('.se-components-wrap img').length
    };
  });
  console.log('\n=== 최종 ===');
  console.log(JSON.stringify(finalCheck, null, 2));
  
  await targetPage.screenshot({ path: 'final_fixed.png', fullPage: true });
  
  await browser.close();
})();
