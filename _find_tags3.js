const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  
  const ep = pages.find(p => p.url().includes('Redirect=Write'));
  
  // Take a screenshot first
  await ep.screenshot({ path: '_editor_full.png', fullPage: true });
  console.log('Screenshot saved');
  
  // Full parent page analysis
  const info = await ep.evaluate(() => {
    const allEls = document.querySelectorAll('*');
    const results = [];
    
    // Find any visible input/textarea
    allEls.forEach(el => {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        const rect = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        results.push({
          tag: el.tagName,
          type: el.type,
          id: el.id,
          class: (el.className || '').substring(0, 40),
          placeholder: el.placeholder || '',
          visible: rect.width > 0 && rect.height > 0 && style.display !== 'none',
          rect: `${Math.round(rect.left)},${Math.round(rect.top)} ${Math.round(rect.width)}x${Math.round(rect.height)}`
        });
      }
    });
    
    // Look for any element mentioning 태그
    const tagTexts = [];
    allEls.forEach(el => {
      const text = el.textContent || '';
      if (text.includes('태그') || text.includes('tag') || text.includes('Tag')) {
        const elText = text.trim().substring(0, 60);
        const cls = (el.className || '').substring(0, 40);
        tagTexts.push({ text: elText, class: cls, tag: el.tagName });
      }
    });
    
    // Check if there's a bottom panel area
    const body = document.body;
    const children = Array.from(body.children);
    const lastChildren = children.slice(-5).map(c => ({
      tag: c.tagName,
      class: (c.className || '').substring(0, 50),
      id: c.id || '',
      visible: c.getBoundingClientRect().width > 0
    }));
    
    return {
      inputCount: results.length,
      inputs: results.slice(0, 10),
      tagTexts: tagTexts.slice(0, 15),
      lastChildren
    };
  });
  
  console.log('=== Full parent page ===');
  console.log(JSON.stringify(info, null, 2));
  
  await b.close();
})();
