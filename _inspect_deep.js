const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page;
  for (const p of pages) { if (p.url().includes('PostWriteForm')) { page = p; break; } }
  if (!page) { console.log('no editor'); await b.close(); return; }
  
  await page.bringToFront();
  await page.waitForTimeout(2000);
  
  // Deep check the DOM structure
  const domInfo = await page.evaluate(() => {
    const result = [];
    
    // Check se-content
    const seContent = document.querySelector('.se-content');
    if (seContent) {
      result.push('se-content found: ' + seContent.className);
      result.push('se-content tag: ' + seContent.tagName);
      result.push('se-content attr: contenteditable=' + seContent.getAttribute('contenteditable'));
      result.push('se-content innerHTML length: ' + seContent.innerHTML.length);
      
      // Find all editable elements
      const editables = seContent.querySelectorAll('[contenteditable]');
      result.push('editable child count: ' + editables.length);
      editables.forEach((el, i) => {
        result.push(`  [${i}] ${el.tagName} class="${(el.className||'').substring(0,40)}" ce=${el.getAttribute('contenteditable')} rect=${JSON.stringify({x:Math.round(el.getBoundingClientRect().x), y:Math.round(el.getBoundingClientRect().y), w:Math.round(el.getBoundingClientRect().width), h:Math.round(el.getBoundingClientRect().height)})}`);
      });
      
      // Check if there's a text module
      const modules = seContent.querySelectorAll('.se-module-text');
      result.push('text modules: ' + modules.length);
      modules.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        result.push(`  [${i}] rect: ${r.x}x${r.y} ${r.width}x${r.height} ce=${el.getAttribute('contenteditable')}`);
        const innerEdit = el.querySelector('[contenteditable]');
        if (innerEdit) {
          const ir = innerEdit.getBoundingClientRect();
          result.push(`    inner editable: (${ir.x},${ir.y}) ${ir.width}x${ir.height}`);
        }
      });
    } else {
      result.push('se-content NOT found');
    }
    
    // Check for any [contenteditable] in the entire document
    const allEditable = document.querySelectorAll('[contenteditable]');
    result.push('\nAll contenteditable in document: ' + allEditable.length);
    allEditable.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      result.push(`  [${i}] ${el.tagName} "${(el.innerText||'').substring(0,30)}" rect=(${Math.round(r.x)},${Math.round(r.y)}) ${Math.round(r.width)}x${Math.round(r.height)}`);
      
      // Try focusing
      try { el.focus(); result.push('    -> focused'); } catch(e) {}
    });
    
    return result.join('\n');
  });
  
  console.log(domInfo);
  
  await page.screenshot({ path: 'editor_deep_dom.png' });
  await b.close();
})();
