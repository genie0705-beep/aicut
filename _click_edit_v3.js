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

    // Synthetic click
    await pf.evaluate(() => {
      const link = document.querySelector('a._modifyPost');
      if (link) link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    });
    
    // Wait for navigation
    await sleep(5000);
    
    console.log('현재 URL:', page.url());
    await page.screenshot({ path: '_debug_edit_page.png' });
    
    const bodyText = await page.evaluate(() => document.body?.innerText?.substring(0, 500) || '').catch(() => '');
    console.log('Body:', bodyText.substring(0, 300));
    
    // Check for SE4
    const seInfo = await page.evaluate(() => {
      const se = window.SmartEditor?.instance || window.SmartEditor?._editors?.blogpc001;
      return { seFound: !!se, hasSmartEditor: !!window.SmartEditor };
    }).catch(() => ({ seFound: false }));
    console.log('SE4:', JSON.stringify(seInfo));
    
  } finally {
    await page.close();
  }
})();
