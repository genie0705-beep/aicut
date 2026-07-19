const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  
  const ep = pages.find(p => p.url().includes('Redirect=Write'));
  const frames = ep.frames();
  const sf = frames.find(f => f.url().includes('/postwrite'));
  
  // Full DOM check inside editor iframe  
  const info = await sf.evaluate(() => {
    const body = document.body;
    const allElements = body.querySelectorAll('*');
    
    // Find all input/textarea/editable
    const inputs = [];
    allElements.forEach(el => {
      const tag = el.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') {
        inputs.push({
          tag, type: el.type, id: el.id,
          class: el.className.substring(0, 40),
          placeholder: el.placeholder || '',
          rect: el.getBoundingClientRect().width + 'x' + el.getBoundingClientRect().height,
          parentClass: (el.parentElement?.className || '').substring(0, 40)
        });
      }
    });
    
    // Look for sections/divs with tag-related classes
    const tagSections = [];
    allElements.forEach(el => {
      const cls = el.className || '';
      const id = el.id || '';
      if (typeof cls === 'string' && (cls.includes('tag') || cls.includes('Tag') || cls.includes('해시'))) {
        tagSections.push({ tag: el.tagName, class: cls.substring(0, 60), id: id.substring(0, 30), text: (el.textContent || '').substring(0, 50) });
      }
    });
    
    // Check for hash tag icon/button
    const hashElements = [];
    allElements.forEach(el => {
      const text = el.textContent || '';
      if (text.includes('#') || text.includes('해시태그') || text.includes('태그')) {
        hashElements.push({ tag: el.tagName, text: text.substring(0, 60), class: (el.className || '').substring(0, 50) });
      }
    });
    
    return {
      inputs,
      tagSections,
      hashElements: hashElements.slice(0, 10)
    };
  });
  
  console.log('=== Editor iframe analysis ===');
  console.log(JSON.stringify(info, null, 2));
  
  await b.close();
})();
