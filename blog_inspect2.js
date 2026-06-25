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

  // Find mainFrame
  let mf = null;
  for (const f of page.frames()) {
    if (f.name() === 'mainFrame') { mf = f; break; }
  }
  if (!mf) { console.log('no mainFrame'); await b.close(); return; }

  const children = mf.childFrames();
  console.log('child frames:', children.length);

  for (let i = 0; i < children.length; i++) {
    const cf = children[i];
    try {
      const info = await cf.evaluate(() => {
        const body = document.body;
        if (!body || body.innerHTML.length < 50) return null;
        
        const ceCount = document.querySelectorAll('[contenteditable]').length;
        const inputs = Array.from(document.querySelectorAll('input')).map(function(el) {
          return { ph: el.placeholder, type: el.type, id: el.id };
        });
        
        // Find contenteditable elements specifically
        const ceEls = Array.from(document.querySelectorAll('[contenteditable]')).map(function(el) {
          return {
            html: (el.innerHTML || '').substring(0, 100),
            id: el.id || '',
            cls: (el.className || '').substring(0, 30)
          };
        });
        
        return {
          url: document.location.href.substring(0, 80),
          htmlLen: body.innerHTML.length,
          text: (body.innerText || '').substring(0, 150),
          ceCount: ceCount,
          ceElements: ceEls,
          inputs: inputs
        };
      }).catch(function(e) { return { error: e.message.substring(0, 50) }; });
      
      if (info) {
        console.log('\nChild ' + i + ': name=' + (cf.name() || '-'));
        console.log('  ' + JSON.stringify(info).substring(0, 500));
      }
    } catch(e) {
      console.log('Child ' + i + ': ERROR ' + e.message.substring(0, 50));
    }
  }

  await b.close();
})();
