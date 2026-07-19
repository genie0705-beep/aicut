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
    if (pf) {
      await pf.evaluate(() => {
        document.querySelector('a._modifyPost')?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      });
    }
    
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    await sleep(5000);

    const editFrame = page.frames().find(f => f.url().includes('PostUpdateForm'));
    if (!editFrame) { console.log('iframe not found'); return; }

    const allComps = await editFrame.evaluate(() => {
      const se = window.SmartEditor?.instance || window.SmartEditor?._editors?.blogpc001;
      if (!se) return 'no SE';
      
      const data = se._documentService.getDocumentData();
      const comps = data.document.components;
      
      return comps.map((c, i) => ({
        idx: i,
        type: c['@ctype'],
        align: c.align || 'none',
        text: c.title ? (c.title[0]?.nodes?.map(n => n.value).join('') || '') : '',
        src: c.src ? c.src.split('?')[0].substring(0, 80) : null,
        fileName: c.fileName || null,
        represent: c.represent,
        nodes: c.nodes ? c.nodes.map(n => n.value || '').join('').substring(0, 80) : null,
        style: c.style || null,
        width: c.width || null,
        height: c.height || null,
      }));
    });
    
    console.log('전체 컴포넌트 (' + allComps.length + '개):');
    allComps.forEach(c => {
      const label = c.type === 'documentTitle' ? '📌 제목' : 
                   c.type === 'image' ? '🖼️ 이미지' : 
                   c.type === 'text' ? '📝 텍스트' : `❓ ${c.type}`;
      const detail = c.nodes || c.fileName || c.text?.substring(0, 40) || c.type;
      console.log(`  [${c.idx}] ${label}: ${detail?.substring(0, 60)}`);
    });

    await page.screenshot({ path: '_debug_full.png' });

  } finally {
    await page.close();
  }
})();
