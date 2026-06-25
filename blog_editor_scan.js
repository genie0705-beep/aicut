const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];

  let page = null;
  for (const pg of ctx.pages()) {
    if (pg.url().includes('postupdate')) {
      page = pg;
      break;
    }
  }

  if (!page) {
    console.log('❌ 에디터 없음');
    await b.close();
    return;
  }

  await page.bringToFront();
  await page.waitForTimeout(2000);

  // Check all frames
  const frames = page.frames();
  console.log('Total frames:', frames.length);
  
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    try {
      const info = await f.evaluate(() => {
        const body = document.body;
        if (!body) return { error: 'no body' };
        return {
          url: document.location.href.substring(0, 100),
          innerText: (body.innerText || '').substring(0, 200),
          editableCount: document.querySelectorAll('[contenteditable]').length,
          iframeCount: document.querySelectorAll('iframe').length,
          seClassCount: document.querySelectorAll('.se-body').length,
          smartEditorCount: document.querySelectorAll('[class*="SmartEditor"], [id*="SmartEditor"], [class*="smartEditor"]').length,
          bodyHtml: (body.innerHTML || '').substring(0, 300)
        };
      }).catch(e => ({ error: e.message.substring(0, 50) }));
      
      console.log('\n[' + i + '] name=' + (f.name() || '-'));
      console.log('    ' + JSON.stringify(info).substring(0, 300));
      
      // Check child frames
      const childFrames = f.childFrames();
      if (childFrames.length > 0) {
        console.log('    childFrames:', childFrames.length);
        for (const cf of childFrames) {
          try {
            const cfInfo = await cf.evaluate(() => {
              return {
                url: document.location.href.substring(0, 80),
                ce: document.querySelectorAll('[contenteditable]').length,
                text: (document.body.innerText || '').substring(0, 100)
              };
            }).catch(e => ({ error: 'ERR: ' + (e.message || '').substring(0, 30) }));
            console.log('      child:', JSON.stringify(cfInfo).substring(0, 150));
          } catch(e) {
            console.log('      child error');
          }
        }
      }
    } catch(e) {
      console.log('[' + i + '] ERROR:', e.message.substring(0, 80));
    }
  }

  await b.close();
})();
