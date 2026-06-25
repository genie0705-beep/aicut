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

  // Search ALL frames for contenteditable and title
  for (let fi = 0; fi < page.frames().length; fi++) {
    const f = page.frames()[fi];
    try {
      const info = await f.evaluate(() => {
        const body = document.body;
        if (!body) return null;
        
        // Find contenteditable
        const ce = document.querySelector('[contenteditable]');
        const ceInfo = ce ? {
          tag: ce.tagName,
          id: ce.id,
          className: (ce.className || '').substring(0, 40),
          html: (ce.innerHTML || '').substring(0, 60),
          rect: Math.round(ce.getBoundingClientRect().x) + ',' + Math.round(ce.getBoundingClientRect().y)
        } : null;
        
        // Find title input
        const titleInputs = Array.from(document.querySelectorAll('input')).filter(function(el) {
          var ph = (el.placeholder || '');
          var aria = (el.getAttribute('aria-label') || '');
          return ph.indexOf('제목') >= 0 || aria.indexOf('제목') >= 0;
        });
        
        // Find any input with placeholder
        const allInputs = Array.from(document.querySelectorAll('input')).map(function(el) {
          return { ph: el.placeholder, type: el.type, id: el.id, cls: (el.className || '').substring(0, 20) };
        });
        
        return {
          url: document.location.href.substring(0, 70),
          hasBody: body.innerHTML.length > 50,
          ceInfo: ceInfo,
          titleCount: titleInputs.length,
          allInputs: allInputs
        };
      }).catch(function() { return null; });
      
      if (info) {
        console.log('\n=== Frame ' + fi + ' ===');
        console.log('  URL:', info.url);
        if (info.ceInfo) console.log('  ✅ contenteditable:', JSON.stringify(info.ceInfo));
        if (info.titleCount > 0) console.log('  ✅ title input found:', info.titleCount);
        if (info.allInputs && info.allInputs.length > 0) console.log('  inputs:', JSON.stringify(info.allInputs));
      }
    } catch(e) {}
  }

  console.log('\n--- 메인 페이지 직접 검사 ---');
  const mainInfo = await page.evaluate(function() {
    var allInputs = Array.from(document.querySelectorAll('input'));
    return {
      totalInputs: allInputs.length,
      inputs: allInputs.slice(0, 10).map(function(el) {
        return {
          ph: el.placeholder,
          type: el.type,
          visible: el.offsetParent !== null
        };
      }),
      buttons: Array.from(document.querySelectorAll('button')).slice(0, 15).map(function(el) {
        return { text: (el.innerText || '').trim().substring(0, 20), visible: el.offsetParent !== null };
      }),
      bodySample: (document.body.innerText || '').substring(0, 200)
    };
  });
  console.log('Main page:', JSON.stringify(mainInfo, null, 2).substring(0, 1000));

  await b.close();
})();
