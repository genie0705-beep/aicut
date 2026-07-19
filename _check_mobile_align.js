const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page = pages[0];
  if (!page) { page = await b.newPage(); }
  page.on('dialog', async d => { await d.dismiss(); });
  
  // Check MOBILE version (m.blog.naver.com)
  await page.goto('https://m.blog.naver.com/aicut/224350581299', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  // Check image alignment in mobile view
  const mobile = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    const results = [];
    imgs.forEach((img, i) => {
      if (img.naturalWidth > 50) {
        const parent = img.parentElement;
        const grandparent = parent ? parent.parentElement : null;
        const grandgrand = grandparent ? grandparent.parentElement : null;
        
        const rect = img.getBoundingClientRect();
        const viewportW = window.innerWidth;
        
        // Calculate offset from center
        const imgCenter = rect.left + rect.width / 2;
        const viewportCenter = viewportW / 2;
        const offsetFromCenter = Math.abs(imgCenter - viewportCenter);
        
        results.push({
          idx: i,
          w: img.naturalWidth,
          h: img.naturalHeight,
          displayW: Math.round(rect.width),
          displayH: Math.round(rect.height),
          left: Math.round(rect.left),
          viewportW: viewportW,
          offsetFromCenter: Math.round(offsetFromCenter),
          parentTag: parent ? parent.tagName : '',
          parentStyles: parent ? parent.getAttribute('style') || '' : '',
        });
      }
    });
    return results;
  });
  
  console.log('=== MOBILE VIEW ALIGNMENT ===');
  mobile.forEach(m => console.log(`Img ${m.idx}: ${m.w}x${m.h} display=${m.displayW}x${m.displayH} left=${m.left}px viewport=${m.viewportW}px offset=${m.offsetFromCenter}px | parent=<${m.parentTag}> style="${m.parentStyles.substring(0,60)}"`));
  
  process.exit(0);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
