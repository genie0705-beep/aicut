const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  let t = null;
  for (const p of pages) { if (p.url().includes('PostWriteForm')) { t = p; break } }
  if (!t) { console.log('NO_TAB'); b.close(); return; }
  t.on('dialog', async d => { await d.dismiss() });
  await t.bringToFront();
  await new Promise(r => setTimeout(r, 2000));

  // Click toolbar image button
  console.log('Clicking img toolbar button...');
  const btn = t.locator('button.se-image-toolbar-button');
  await btn.click();
  await new Promise(r => setTimeout(r, 2000));

  // Check all visible layers/popups
  const info = await t.evaluate(() => {
    const layers = document.querySelectorAll('[class*="layer"],[class*="popup"],[class*="menu"]');
    const results = [];
    layers.forEach(l => {
      if (l.offsetParent !== null) {
        results.push({
          tag: l.tagName,
          cls: l.className.substring(0, 100),
          text: l.innerText.replace(/\s+/g, ' ').trim().substring(0, 300)
        });
      }
    });
    // Also check for any dialog/modal
    const dialogs = document.querySelectorAll('[role="dialog"],[role="menu"],[aria-modal="true"]');
    dialogs.forEach(d => {
      if (d.offsetParent !== null) {
        results.push({
          tag: d.tagName,
          role: d.getAttribute('role'),
          text: d.innerText.replace(/\s+/g, ' ').trim().substring(0, 300)
        });
      }
    });
    return results;
  });
  console.log('POPUPS:', JSON.stringify(info, null, 2));

  // Check all visible buttons now
  const btns = await t.evaluate(() => {
    return Array.from(document.querySelectorAll('button'))
      .filter(b => b.offsetParent !== null)
      .map(b => ({
        text: (b.innerText || '').trim().substring(0, 40),
        cls: b.className.substring(0, 60)
      }));
  });
  console.log('VISIBLE BUTTONS:', JSON.stringify(btns));

  await t.screenshot({ path: 'blog_popup_debug.png' });
  console.log('SCREENSHOT SAVED');

  b.close();
})().catch(e => console.log('ERR: ' + e.message.substring(0, 200)));
