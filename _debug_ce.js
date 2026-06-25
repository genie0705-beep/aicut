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
    // Find all contenteditable elements
    const allCE = document.querySelectorAll('[contenteditable]');
    const results = [];
    allCE.forEach((el, idx) => {
      const rect = el.getBoundingClientRect();
      results.push({
        idx,
        tag: el.tagName,
        id: el.id,
        cls: el.className.substring(0, 80),
        visible: rect.width > 0 && rect.height > 0,
        rect: { w: Math.round(rect.width), h: Math.round(rect.height) },
        textLen: (el.innerText || '').length
      });
    });
    
    // Also find the editor wrapper
    const wrappers = document.querySelectorAll('[class*="se-component"], [class*="editor"], [class*="content"]');
    const wrapInfo = [];
    wrappers.forEach(el => {
      if (el.offsetParent !== null && el.children.length > 0) {
        const cls = el.className;
        if (cls.includes('component') || cls.includes('editor') || cls.includes('content') || cls.includes('text')) {
          wrapInfo.push({
            tag: el.tagName,
            cls: cls.substring(0, 100),
            children: el.children.length,
            text: el.innerText.replace(/\s+/g, ' ').trim().substring(0, 60)
          });
        }
      }
    });
    
    return { contenteditables: results, relevantWrappers: wrapInfo.slice(0, 15) };
  });
  
  console.log(JSON.stringify(info, null, 2));
  b.close();
})().catch(e => console.log('ERR: ' + e.message));
