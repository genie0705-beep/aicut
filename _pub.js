const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const p = ctx.pages()[0];
  
  p.on('dialog', async d => { console.log('Dialog:', d.message().substring(0,60)); try { await d.accept(); } catch(e) {} });
  
  const frames = p.frames();
  const sf = frames.find(f => f.url().includes('PostWriteForm') || f.url().includes('/postwrite'));
  if (!sf) { console.log('No SE frame'); await b.close(); return; }
  
  // Click 諛쒎굜 button
  const pubBtn = sf.locator('.publish_btn__m9KHH');
  const pubVis = await pubBtn.isVisible();
  console.log('publish button visible:', pubVis);
  
  if (pubVis) {
    await pubBtn.click();
    console.log('publish clicked!');
    await p.waitForTimeout(3000);
  }
  
  console.log('done');
  await b.close();
})();
