const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  let t = null;
  for (const p of pages) { if (p.url().includes('PostWriteForm')) { t = p; break } }
  if (!t) { console.log('NO_TAB'); b.close(); return; }
  
  await t.bringToFront();
  await new Promise(r => setTimeout(r, 2000));
  
  // Check the editor's setDocumentData for image components
  const info = await t.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData(true); // true = pretty
    const imgs = data.document.components.filter(c => c['@ctype'] === 'image');
    const details = imgs.map((c, i) => ({
      index: i,
      id: c.id,
      hasSrc: !!c.src,
      hasInternal: !!c.internalResource,
      hasRepresent: !!c.represent,
      internalType: c.internalResource ? Object.keys(c.internalResource) : []
    }));
    return { totalComponents: data.document.components.length, imageDetails: details };
  });
  
  console.log(JSON.stringify(info, null, 2));
  
  // Try clicking on the first empty image component to activate it
  const imgComponents = await t.$$('.se-component.se-image');
  console.log('Image components in DOM:', imgComponents.length);
  
  // Check the image component DOM
  const imgDomInfo = await t.evaluate(() => {
    const imgs = document.querySelectorAll('.se-component.se-image');
    return Array.from(imgs).map((el, i) => ({
      index: i,
      html: el.innerHTML.replace(/\s+/g, ' ').trim().substring(0, 200),
      visible: el.offsetParent !== null
    }));
  });
  console.log('Image DOM:', JSON.stringify(imgDomInfo, null, 2));
  
  b.close();
})().catch(e => console.log('ERR: ' + e.message));
