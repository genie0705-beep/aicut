const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();

  console.log('Navigating to post write...');
  await page.goto('https://blog.naver.com/PostWrite.nhn?blogId=aicut', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(8000);

  console.log('\n=== Page URL:', page.url());
  
  // Check all iframes
  const frames = page.frames();
  console.log(`\n=== Frames (${frames.length}):`);
  frames.forEach((f, i) => {
    console.log(`[${i}] ${f.url().slice(0, 100)}`);
  });

  // Look for SE4 in main page
  const mainEval = await page.evaluate(() => {
    const keys = Object.keys(window).filter(k => 
      k.includes('Smart') || k.includes('Editor') || k.includes('editor') || k.includes('smart')
    );
    return {
      smartEditorExists: typeof SmartEditor !== 'undefined',
      smartEditorWindowExists: typeof window.SmartEditor !== 'undefined',
      keys: keys.slice(0, 20)
    };
  }).catch(e => ({ error: e.message }));
  console.log('\n=== Main window:', JSON.stringify(mainEval));

  // Try each iframe for SmartEditor
  for (let i = 0; i < frames.length; i++) {
    try {
      const result = await frames[i].evaluate(() => {
        const hasSE = typeof SmartEditor !== 'undefined';
        const hasSE2 = typeof window.SmartEditor !== 'undefined';
        const keys = Object.keys(window).filter(k => 
          k.includes('Smart') || k.includes('Editor') || k.includes('editor')
        ).slice(0, 10);
        return { hasSE, hasSE2, keys, url: window.location.href };
      });
      console.log(`\n[${i}] Frame:`, JSON.stringify(result));
    } catch(e) {
      console.log(`[${i}] Frame error: ${e.message}`);
    }
  }

  // Take a screenshot
  await page.screenshot({ path: path.join(__dirname, '..', '_editor_state.png'), fullPage: false });
  console.log('\nScreenshot saved: _editor_state.png');
})();
