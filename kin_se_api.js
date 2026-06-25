const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(()=>{}));

  const pages = ctx.pages();
  let p = null;
  for (const pg of pages) {
    if (pg.url().includes('493566474')) { p = pg; break; }
  }
  if (!p) { console.log('page not found'); await b.close(); return; }

  await p.bringToFront();
  await p.waitForTimeout(1000);

  // Try SmartEditor API methods
  const apiExplorer = await p.evaluate(() => {
    const result = {};
    
    // SmartEditor constructor or instance
    if (typeof SmartEditor === 'function') {
      result.SmartEditor_type = typeof SmartEditor;
      result.SmartEditor_proto = Object.getOwnPropertyNames(SmartEditor.prototype).slice(0, 20);
    }
    
    // Check for SmartEditor instances on DOM
    // SE editors are usually stored in data attributes or global arrays
    const seElements = document.querySelectorAll('[data-se-editor]');
    result.seEditorElements = seElements.length;
    
    // Find all instances
    // Naver SE2 usually stores instances in window.se or window.se2
    if (window.se) result.se_window = Object.keys(window.se).slice(0, 10);
    if (window.se2) result.se2_window = Object.keys(window.se2).slice(0, 10);
    
    // Try to find editor instances via jQuery data
    const editors = document.querySelectorAll('div[contenteditable="true"]');
    result.editorCount = editors.length;
    if (editors.length > 0) {
      const ed = editors[0];
      // Check for SE-related data
      const dataset = Object.keys(ed.dataset).filter(k => k.includes('se') || k.includes('editor'));
      result.dataset = dataset;
      
      // Check parent elements for SE instance references
      let parent = ed.parentElement;
      let seRefs = [];
      for (let i = 0; i < 5 && parent; i++) {
        const attrs = parent.getAttributeNames ? Array.from(parent.getAttributeNames()).filter(a => a.includes('se') || a.includes('editor')) : [];
        if (attrs.length > 0 || (parent.className && parent.className.includes('se-'))) {
          seRefs.push({
            tag: parent.tagName,
            class: parent.className.substring(0, 60),
            attrs: attrs
          });
        }
        parent = parent.parentElement;
      }
      result.seRefs = seRefs;
    }
    
    // Check for stored SE data in global objects
    const globalKeys = Object.keys(window);
    const seKeys = globalKeys.filter(k => 
      k.startsWith('__se') || k.startsWith('se') || k.startsWith('_se')
    );
    result.seGlobalKeys = seKeys.slice(0, 15);
    
    // Try to find how SmartEditor stores instances
    // In SE2, editors are in SmartEditor.editors
    if (SmartEditor.editors) {
      result.editors = Object.keys(SmartEditor.editors);
    }
    
    return result;
  });
  
  console.log(JSON.stringify(apiExplorer, null, 2));
  
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 300)));
