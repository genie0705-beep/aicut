const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page = pages[0];
  if (!page) { page = await b.newPage(); }
  page.on('dialog', async d => { await d.dismiss(); });
  
  await page.goto('https://m.blog.naver.com/aicut/224350581299', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  // Check image alignment
  const imgAlign = await page.evaluate(() => {
    const sections = document.querySelectorAll('section.se-section');
    const results = [];
    sections.forEach((s, i) => {
      const cls = s.className;
      const style = s.getAttribute('style') || '';
      const isImg = cls.includes('image');
      const align = cls.includes('align-ce') ? 'center' : (style.includes('text-align:center') ? 'center' : 'OTHER');
      const text = (s.textContent || '').replace(/\s+/g, ' ').trim().substring(0, 40);
      if (isImg || text) {
        results.push({ idx: i, type: isImg ? 'IMAGE' : 'TEXT', class: cls.substring(0, 50), align, text });
      }
    });
    return results;
  });
  
  console.log('=== SECTION ALIGNMENT ===');
  imgAlign.forEach(s => console.log(`${s.idx}: [${s.type}] align=${s.align} class=${s.class} | ${s.text}`));
  
  // Also check individual image container alignment
  const imgModuleAlign = await page.evaluate(() => {
    const imgModules = document.querySelectorAll('.se-module-image');
    return Array.from(imgModules).map((m, i) => ({
      idx: i,
      style: m.getAttribute('style') || '',
      parentStyle: m.parentElement ? m.parentElement.getAttribute('style') || '' : '',
      sectionAlign: m.closest('section') ? m.closest('section').className : ''
    }));
  });
  
  console.log('\n=== IMAGE MODULE ALIGNMENT ===');
  imgModuleAlign.forEach(m => console.log(`Image ${m.idx}: style="${m.style.substring(0,60)}" section="${m.sectionAlign}"`));
  
  // Verify images are displaying
  const imgs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('img')).map((img, i) => ({
      idx: i,
      w: img.naturalWidth,
      h: img.naturalHeight,
      loaded: img.complete
    })).filter(ig => ig.w > 50);
  });
  
  console.log(`\n=== IMAGES LOADED: ${imgs.length} ===`);
  imgs.forEach(ig => console.log(`  ${ig.idx}: ${ig.w}x${ig.h} loaded=${ig.loaded}`));
  
  process.exit(0);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
