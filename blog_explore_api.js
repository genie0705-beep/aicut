const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  
  let page = null;
  for (const pg of ctx.pages()) {
    if (pg.url().indexOf('aicut') >= 0 && pg.url().indexOf('Write') >= 0) { page = pg; break; }
  }
  if (!page) { console.log('no page'); await b.close(); return; }
  await page.bringToFront();
  await new Promise(function(r) { setTimeout(r, 2000); });

  let ef = null;
  for (const f of page.frames()) {
    if (f.url().indexOf('PostWriteForm') >= 0 && f.url().indexOf('wtm') < 0 && !f.name().startsWith('input')) {
      ef = f; break;
    }
  }
  if (!ef) { console.log('no editor'); await b.close(); return; }

  // Explore document structure and set content
  var result = await ef.evaluate(function() {
    try {
      var ed = SmartEditor._editors['blogpc001'];
      var data = ed.getDocumentData();
      var doc = data.document;
      
      // Check components
      var comps = doc.components;
      var compInfo = [];
      if (Array.isArray(comps)) {
        comps.forEach(function(c, i) {
          if (i < 5) {
            compInfo.push({
              idx: i,
              type: c.type || '?',
              text: (c.textContent || c.value || '').toString().substring(0, 30),
              path: c.path || c.id || ''
            });
          }
        });
      }
      
      // Check title field
      var title = doc.title || '(no title field)';
      
      // Check if title is a separate property
      var allKeys = Object.keys(doc).slice(0, 15);
      
      return {
        dataKeys: Object.keys(data),
        docKeys: allKeys,
        components: compInfo,
        title: title,
        hasTitleField: doc.hasOwnProperty('title'),
        hasContentField: doc.hasOwnProperty('content')
      };
      
    } catch(e) { return 'error: ' + e.message.substring(0, 100); }
  });

  console.log(JSON.stringify(result, null, 2));
  
  await b.close();
})();
