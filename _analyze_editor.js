const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  try {
    await page.goto('https://blog.naver.com/aicut/224341544476', { waitUntil: 'load', timeout: 20000 });
    await sleep(4000);

    const pf = page.frames().find(f => f.url().includes('PostView'));
    if (!pf) { console.log('PostView iframe not found'); return; }

    await pf.evaluate(() => {
      document.querySelector('a._modifyPost')?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    });
    
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    await sleep(5000);

    // PostUpdateForm iframe 찾기
    const editFrame = page.frames().find(f => f.url().includes('PostUpdateForm'));
    if (!editFrame) { console.log('PostUpdateForm iframe not found'); return; }
    console.log('✅ PostUpdateForm iframe 발견');

    // SE4 확인
    const seInfo = await editFrame.evaluate(() => {
      const se = window.SmartEditor?.instance || window.SmartEditor?._editors?.blogpc001;
      if (!se) return { seFound: false, hasSE: !!window.SmartEditor };
      
      try {
        const docSvc = se._documentService;
        const data = docSvc.getDocumentData();
        let textCount = 0, imgCount = 0;
        const comps = data.map(c => {
          if (c.type === 'text') textCount++;
          if (c.type === 'image') imgCount++;
          return {
            type: c.type,
            text: (c.text || '').substring(0, 60),
            align: c.align || 'none'
          };
        });
        
        return {
          seFound: true,
          totalComponents: data.length,
          textComponents: textCount,
          imageComponents: imgCount,
          has_insertDoc: typeof docSvc.insertDocumentData === 'function',
          has_setDoc: typeof docSvc.setDocumentData === 'function',
          has_appendDoc: typeof docSvc.appendDocumentData === 'function',
          getContentText: (se.getContentText?.() || '').substring(0, 200),
          components: comps
        };
      } catch(e) {
        return { seFound: true, error: e.message };
      }
    });
    
    console.log('SE4 정보:', JSON.stringify(seInfo, null, 2));

    await page.screenshot({ path: '_debug_editor_loaded.png' });

  } finally {
    await page.close();
  }
})();
