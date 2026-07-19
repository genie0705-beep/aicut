const { chromium } = require('playwright');
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  try {
    await page.goto('https://blog.naver.com/aicut/224341544476', { waitUntil: 'load', timeout: 20000 });
    await sleep(4000);
    
    const pf = page.frames().find(f => f.url().includes('PostView'));
    if (pf) {
      await pf.evaluate(() => {
        document.querySelector('a._modifyPost')?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      });
    }
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    await sleep(5000);

    const editFrame = page.frames().find(f => f.url().includes('PostUpdateForm'));
    if (!editFrame) { console.log('not found'); return; }

    // Check state
    const state = await editFrame.evaluate(() => {
      const se = window.SmartEditor?.instance || window.SmartEditor?._editors?.blogpc001;
      if (!se) return null;
      const doc = se._documentService.getDocumentData();
      const comps = doc.document.components;
      return comps.map((c, i) => ({
        idx: i,
        type: c['@ctype'],
        fileName: c.fileName || null,
        srcType: (c.src || 'none').startsWith('data:') ? 'dataURI' : (c.src ? 'url' : 'none'),
        src: (c.src || '').substring(0, 50),
        align: c.align || 'none',
        imageLoaded: c.imageLoaded,
      }));
    });
    
    if (!state) { console.log('state null'); return; }
    
    console.log('문서 상태:');
    state.forEach(c => {
      const icon = c.type === 'image' ? '🖼️' : c.type === 'text' ? '📝' : c.type === 'documentTitle' ? '📌' : '❓';
      const loaded = c.imageLoaded === undefined ? '' : ` loaded=${c.imageLoaded}`;
      console.log(`  [${c.idx}] ${icon} ${c.type} a=${c.align} src=${c.srcType}${loaded} ${c.fileName || ''}`);
    });

    // Find "저장" in all frames
    console.log('\n저장 버튼 찾기...');
    for (const f of page.frames()) {
      try {
        const btns = await f.evaluate(() => {
          const all = document.querySelectorAll('button, a');
          return Array.from(all)
            .filter(el => el.offsetParent !== null)
            .map(el => ({ tag: el.tagName, text: (el.textContent || '').trim(), cls: el.className?.substring(0, 30) }))
            .filter(el => el.text.includes('저장'));
        });
        if (btns.length > 0) {
          console.log(`  Frame: ${f.url().substring(0, 60)} -> 저장 버튼:`, JSON.stringify(btns));
        }
      } catch(e) {}
    }

    // Check 발행/저장 in editFrame
    const saveFrame = await editFrame.evaluate(() => {
      const btns = document.querySelectorAll('button');
      return Array.from(btns)
        .filter(el => el.offsetParent !== null)
        .map(el => ({ tag: el.tagName, text: (el.textContent || '').trim().substring(0, 30), cls: el.className?.substring(0, 40) }));
    });
    console.log('\n에디터 iframe 버튼들:', JSON.stringify(saveFrame));

    await page.screenshot({ path: '_debug_final_state.png' });

  } finally {
    await page.close();
  }
})();
