const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(()=>{}));

  const pages = ctx.pages();
  let p = null;
  for (const pg of pages) {
    if (pg.url().includes('493566474')) { p = pg; break; }
  }
  if (!p) { console.log('page not found'); await b.close(); return; }

  await p.bringToFront();
  await p.waitForTimeout(1000);

  // Check SE internal state
  const seState = await p.evaluate(() => {
    // Check if SE has a specific API
    const seBody = document.querySelector('.se-body');
    const seWrap = document.querySelector('.se-wrap');
    
    // Check window for SE objects
    const seObjects = Object.keys(window).filter(k => 
      k.toLowerCase().includes('se') || k.toLowerCase().includes('smart') || k.includes('editor')
    );
    
    // Check if there are any global SE instances
    const hasjindo = typeof window.jindo !== 'undefined';
    const hasSEEditor = typeof window.SEEditor !== 'undefined';
    const hasSE2 = typeof window.se2 !== 'undefined' || typeof window.se !== 'undefined';
    
    // Check the _se_* attributes on elements
    const seComponents = document.querySelectorAll('[class*=se-]');
    const seCompInfo = Array.from(seComponents).slice(0, 3).map(el => ({
      tag: el.tagName,
      class: el.className.substring(0, 60),
      childCount: el.children.length,
      innerLen: el.innerText.length
    }));
    
    // Check the editor content div specifically
    const contentEditable = document.querySelector('div[contenteditable="true"]');
    const ceInfo = contentEditable ? {
      className: contentEditable.className,
      id: contentEditable.id,
      children: contentEditable.children.length,
      innerHTML: contentEditable.innerHTML.substring(0, 300)
    } : null;
    
    // Check for hidden textarea that SE might sync to
    const hiddenTextareas = Array.from(document.querySelectorAll('textarea[style*="display:none"], textarea[type="hidden"]'));
    
    return {
      seObjects: seObjects,
      hasjindo, hasSEEditor, hasSE2,
      seBody: seBody ? 'found' : 'not found',
      seWrap: seWrap ? 'found' : 'not found',
      seCompInfo: seCompInfo,
      ceInfo: ceInfo,
      hiddenTextareas: hiddenTextareas.map(t => ({ id: t.id, name: t.name }))
    };
  });
  
  console.log(JSON.stringify(seState, null, 2));
  
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 200)));
