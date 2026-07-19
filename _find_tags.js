const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  
  const ep = pages.find(p => p.url().includes('Redirect=Write'));
  const frames = ep.frames();
  const sf = frames.find(f => f.url().includes('/postwrite'));
  
  // Check the parent page for tag input
  const parentInfo = await ep.evaluate(() => {
    // Look for the tag section more broadly
    const body = document.body;
    
    // Check all text inputs and textareas
    const inputs = document.querySelectorAll('input, textarea, [contenteditable="true"]');
    const results = [];
    
    inputs.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        results.push({
          tag: el.tagName,
          type: el.type || '',
          id: el.id || '',
          class: (el.className || '').substring(0, 60),
          placeholder: el.placeholder || '',
          title: el.title || '',
          rect: `${rect.left},${rect.top} ${rect.width}x${rect.height}`,
          parentClass: (el.parentElement?.className || '').substring(0, 40)
        });
      }
    });
    
    return {
      inputCount: results.length,
      inputs: results,
      // Also look for specific 태그 keywords
      tagElems: Array.from(document.querySelectorAll('*')).filter(el => {
        const text = el.textContent || '';
        return text.includes('태그') && text.length < 100;
      }).slice(0, 5).map(el => ({
        text: (el.textContent || '').substring(0, 80),
        class: (el.className || '').substring(0, 50),
        id: el.id || ''
      }))
    };
  });
  
  console.log('=== Parent page inputs ===');
  console.log(JSON.stringify(parentInfo, null, 2));
  
  await b.close();
})();
