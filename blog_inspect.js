const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  
  let page = null;
  for (const pg of ctx.pages()) {
    if (pg.url().includes('Redirect=Write')) { page = pg; break; }
  }
  if (!page) { console.log('no page'); await b.close(); return; }
  
  await page.bringToFront();
  await page.waitForTimeout(3000);
  
  // Inspect ALL frames for useful elements
  for (let fi = 0; fi < page.frames().length; fi++) {
    const f = page.frames()[fi];
    try {
      const info = await f.evaluate(() => {
        const body = document.body;
        if (!body) return null;
        
        // Find all inputs, buttons, contenteditables
        const inputs = Array.from(document.querySelectorAll('input, textarea, [contenteditable], button, [role="button"]'));
        
        const elements = [];
        inputs.forEach(function(el) {
          const tag = el.tagName;
          const type = el.type || '';
          const ph = el.placeholder || '';
          const aria = el.getAttribute('aria-label') || '';
          const text = (el.innerText || el.textContent || '').trim().substring(0, 30);
          const id = el.id || '';
          const cls = (el.className || '').substring(0, 40);
          const ce = el.getAttribute('contenteditable') || '';
          const rect = el.getBoundingClientRect();
          const visible = rect.width > 0 && rect.height > 0;
          
          if ((text || ph || aria || id || ce) && visible) {
            elements.push({
              tag: tag,
              type: type,
              placeholder: ph.substring(0, 20),
              ariaLabel: aria.substring(0, 20),
              text: text.substring(0, 15),
              id: id.substring(0, 15),
              contenteditable: ce,
              visible: visible
            });
          }
        });
        
        return {
          htmlLen: body.innerHTML.length,
          inputs: elements.slice(0, 30)
        };
      }).catch(() => null);
      
      if (info && info.inputs && info.inputs.length > 0) {
        console.log('\n=== Frame ' + fi + ': ' + (f.name() || f.url().substring(0, 60)));
        info.inputs.forEach(function(el) {
          console.log('  [' + el.tag + '] ' +
            (el.type ? 'type=' + el.type : '') +
            (el.placeholder ? ' ph="' + el.placeholder + '"' : '') +
            (el.ariaLabel ? ' aria="' + el.ariaLabel + '"' : '') +
            (el.contenteditable ? ' CE' : '') +
            (el.text ? ' txt="' + el.text + '"' : '') +
            (el.id ? ' id=' + el.id : ''));
        });
        break; // Found editor content
      }
    } catch(e) {}
  }
  
  await b.close();
})();
