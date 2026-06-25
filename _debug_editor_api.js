const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  let t = null;
  for (const p of pages) { if (p.url().includes('PostWriteForm')) { t = p; break } }
  if (!t) { console.log('NO_TAB'); b.close(); return; }
  
  await t.bringToFront();
  await new Promise(r => setTimeout(r, 2000));
  
  const info = await t.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const results = { keys: [], methods: [], ceInfo: [] };
    
    // Get all keys
    results.keys = Object.keys(ed).filter(k => !k.startsWith('_')).slice(0, 30);
    
    // Get function names
    for (const k in ed) {
      if (typeof ed[k] === 'function') {
        const str = ed[k].toString().substring(0, 100);
        results.methods.push({ name: k, sig: str.substring(0, 60) });
      }
    }
    
    // Check the editor's component model
    if (ed.getDocumentData) {
      const data = ed.getDocumentData();
      if (data && data.document && data.document.components) {
        results.components = data.document.components.map(c => ({
          ctype: c['@ctype'] || c.type,
          attrs: Object.keys(c).filter(k => !k.startsWith('@')).slice(0, 10)
        }));
      }
    }
    
    return results;
  });
  
  console.log('Editor API:');
  console.log('  Keys:', JSON.stringify(info.keys));
  console.log('  Methods:', JSON.stringify(info.methods, null, 2));
  console.log('  Components:', JSON.stringify(info.components, null, 2));
  
  b.close();
})().catch(e => console.log('ERR: ' + e.message));
