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

    // SE4 상세 분석
    const detail = await editFrame.evaluate(() => {
      const se = window.SmartEditor?.instance || window.SmartEditor?._editors?.blogpc001;
      if (!se) return { error: 'no SE' };

      const docSvc = se._documentService;
      const raw = docSvc.getDocumentData();
      
      // raw가 무엇인지 확인
      const type = typeof raw;
      const isArray = Array.isArray(raw);
      const json = JSON.stringify(raw).substring(0, 3000);
      
      // 다른 API 시도
      let getTextResult = null;
      try { getTextResult = se.getContentText().substring(0, 500); } catch(e) { getTextResult = 'error: ' + e.message; }
      
      return {
        dataType: type,
        isArray,
        dataPreview: json,
        getContentText: getTextResult,
        seKeys: Object.keys(se).filter(k => !k.startsWith('_')).slice(0, 20),
        docSvcKeys: Object.keys(docSvc).slice(0, 20),
      };
    });
    
    console.log('상세 분석:', JSON.stringify(detail, null, 2));
    
  } finally {
    await page.close();
  }
})();
