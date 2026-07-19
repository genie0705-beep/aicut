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

    // Click edit
    await pf.evaluate(() => {
      document.querySelector('a._modifyPost')?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    });
    
    // Wait for navigation and full page load
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    await sleep(5000);
    
    console.log('URL:', page.url());
    console.log('Title:', await page.title());
    
    // Check all frames
    const frames = page.frames();
    console.log(`Frames: ${frames.length}`);
    frames.forEach((f, i) => {
      const u = f.url().substring(0, 120);
      if (u.length > 10) console.log(`  [${i}] ${u}`);
    });
    
    // Full page body text
    let allText = '';
    for (const f of frames) {
      try {
        const t = await f.evaluate(() => document.body?.innerText?.substring(0, 300) || '').catch(() => '');
        if (t) { allText += `\n--- frame ${f.url().substring(0, 30)} ---\n${t}`; }
      } catch(e) {}
    }
    console.log('All frame texts:', allText.substring(0, 1000));
    
    await page.screenshot({ path: '_debug_edit_v4.png' });

  } finally {
    await page.close();
  }
})();
