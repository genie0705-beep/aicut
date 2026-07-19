const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  page.on('dialog', async d => { await d.accept(); });
  
  await page.goto('https://blog.naver.com/aicut?Redirect=Write&', { waitUntil: 'networkidle', timeout: 20000 });
  const fe = await page.$('#mainFrame');
  const f = await fe.contentFrame();
  
  // Wait for SE
  for (let i = 0; i < 20; i++) {
    const ok = await f.evaluate(() => typeof SmartEditor?._editors?.['blogpc001'] !== 'undefined');
    if (ok) break;
    await page.waitForTimeout(1000);
  }
  
  await f.evaluate(() => document.querySelectorAll('.se-popup-dim, .se-popup, .se-flayer').forEach(el => el.remove()));
  await page.waitForTimeout(500);
  
  // Show all elements and what gets focus
  const info = await f.evaluate(() => {
    const results = [];
    
    // 1. All contentEditables
    const ces = document.querySelectorAll('[contenteditable]');
    results.push(`contentEditables: ${ces.length}`);
    ces.forEach((ce, i) => {
      results.push(`  [${i}] tag=${ce.tagName} id=${ce.id} cls="${ce.className}" text="${(ce.innerText||'').substring(0,30)}"`);
    });
    
    // 2. active element before focus
    results.push(`activeElement: ${document.activeElement?.tagName || 'none'} class="${(document.activeElement?.className||'').substring(0,30)}"`);
    
    // 3. Try focusFirstText
    try {
      const ed = SmartEditor._editors['blogpc001'];
      ed._canvasScrollingService?.focusFirstText();
      results.push('focusFirstText called');
    } catch(e) { results.push(`focusFirstText error: ${e.message}`); }
    
    // 4. active element after focus
    results.push(`afterFocus: ${document.activeElement?.tagName || 'none'} class="${(document.activeElement?.className||'').substring(0,40)}" id="${document.activeElement?.id || ''}"`);
    
    // 5. document.hasFocus
    results.push(`hasFocus: ${document.hasFocus()}`);
    
    return results;
  });
  
  console.log(info.join('\n'));
  
  // Now try typing on the page level
  console.log('\n⌨️ page.keyboard.type()...');
  await page.keyboard.type('TEST', { delay: 20 });
  await page.waitForTimeout(500);
  
  const after = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const d = ed.getDocumentData().document;
    const canvas = document.querySelector('.se-canvas');
    const r = {};
    if (d.blocks) r.blocks = d.blocks.length;
    r.canvasText = (canvas?.innerText || '').substring(0, 100);
    // Check contentEditable
    const ce = document.querySelector('[contenteditable]');
    r.ceInner = ce ? ce.innerText.substring(0, 50) : 'none';
    return r;
  });
  
  console.log('결과:', JSON.stringify(after));
  
  process.exit(0);
}

main().catch(e => console.error('❌', e.message));
