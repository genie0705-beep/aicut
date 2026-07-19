const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page = pages[0];
  if (!page) { page = await b.newPage(); }
  page.on('dialog', async d => { await d.dismiss(); });
  
  await page.goto('https://blog.naver.com/PostView.naver?blogId=aicut&logNo=224350581299', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);
  
  // Detailed alignment check - style vs class
  const detail = await page.evaluate(() => {
    const results = [];
    const all = document.querySelectorAll('.se-section, [class*=se-section]');
    all.forEach((s, i) => {
      const cls = s.className;
      const styleText = s.getAttribute('style') || '';
      const textAlign = s.style.textAlign || '(none)';
      
      // Check child alignments too
      const children = s.querySelectorAll('*');
      let childCenter = 0;
      let childTotal = 0;
      children.forEach(c => {
        if (c.style.textAlign === 'center') childCenter++;
        childTotal++;
      });
      
      const preview = (s.textContent || '').replace(/\s+/g, ' ').trim().substring(0, 50);
      
      if (cls.includes('se-section-text') || cls.includes('se-section-image') || cls.includes('se-section-oglink')) {
        results.push({
          idx: i,
          type: cls.includes('se-section-image') ? 'IMAGE' : cls.includes('se-section-oglink') ? 'OGLINK' : 'TEXT',
          classCenter: cls.includes('se-section-align-ce') ? '✅' : '❌',
          styleTextAlign: textAlign,
          hasStyle: styleText ? '✅' : '❌',
          childCenters: `${childCenter}/${childTotal}`,
          preview
        });
      }
    });
    return results;
  });
  
  console.log('=== DETAILED ALIGNMENT CHECK ===');
  detail.forEach(d => console.log(`${d.idx}: [${d.type}] classCenter=${d.classCenter} style=${d.styleTextAlign} hasStyle=${d.hasStyle} children=${d.childCenters} | ${d.preview}`));
  
  // Get actual computed style for image containers
  const computed = await page.evaluate(() => {
    const imgs = document.querySelectorAll('.se-section-image');
    return Array.from(imgs).map((s, i) => {
      const img = s.querySelector('img');
      const parentDiv = s.querySelector('.se-module-image');
      const computed = window.getComputedStyle(s);
      const parentComputed = parentDiv ? window.getComputedStyle(parentDiv) : null;
      return {
        idx: i,
        sectionDisplay: computed.display,
        sectionTextAlign: computed.textAlign,
        sectionMargin: computed.margin,
        moduleTextAlign: parentComputed ? parentComputed.textAlign : 'N/A',
        moduleDisplay: parentComputed ? parentComputed.display : 'N/A',
        imgW: img ? img.naturalWidth : 0,
        imgH: img ? img.naturalHeight : 0,
      };
    });
  });
  
  console.log('\n=== COMPUTED STYLES FOR IMAGES ===');
  computed.forEach(c => console.log(`Image ${c.idx}: ${c.imgW}x${c.imgH} | section: display=${c.sectionDisplay} textAlign=${c.sectionTextAlign} margin=${c.sectionMargin} | module: textAlign=${c.moduleTextAlign} display=${c.moduleDisplay}`));
  
  process.exit(0);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
