const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const page = pages[0] || await b.newPage();
  
  // Handle dialogs
  page.on('dialog', async d => { await d.dismiss(); });
  
  await page.goto('https://m.blog.naver.com/aicut/224346527054', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  // Get ALL images with details
  const images = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    const results = [];
    imgs.forEach((img, i) => {
      const src = img.getAttribute('src') || '';
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      if (w > 0 && (src.includes('blog') || src.includes('naver') || w > 100)) {
        results.push({
          index: i,
          src: src.substring(0, 120),
          alt: img.alt || '',
          width: w,
          height: h,
          displayW: img.clientWidth,
          displayH: img.clientHeight,
          className: img.className
        });
      }
    });
    return results;
  });
  
  console.log('=== ALL IMAGES ===');
  console.log(JSON.stringify(images, null, 2));
  
  // Get content structure
  const structure = await page.evaluate(() => {
    const items = document.querySelectorAll('.se_module, .se-module, [class*=se-module-], .se-section, section');
    const results = [];
    items.forEach((el, i) => {
      const cls = el.className;
      const isImg = cls.includes('image') || cls.includes('Image') || cls.includes('ImageModule');
      const isText = cls.includes('text') || cls.includes('Text');
      const text = (el.textContent || '').replace(/\s+/g, ' ').substring(0, 100).trim();
      results.push({
        idx: i,
        class: cls.substring(0, 60),
        type: isImg ? 'IMAGE' : isText ? 'TEXT' : 'OTHER',
        text: text.substring(0, 80)
      });
    });
    return results;
  });
  
  console.log('\n=== CONTENT STRUCTURE ===');
  let seq = 0;
  structure.forEach(s => {
    if (s.type !== 'OTHER' || s.text) {
      console.log(`  ${++seq}. [${s.type}] ${s.class} | ${s.text}`);
    }
  });
  
  // Check text alignment
  const align = await page.evaluate(() => {
    const items = document.querySelectorAll('[class*=mod]');
    const counts = {};
    items.forEach(el => {
      const a = el.style.textAlign;
      if (a) counts[a] = (counts[a] || 0) + 1;
    });
    return counts;
  });
  console.log('\n=== ALIGNMENT ===');
  console.log(JSON.stringify(align));
  
  await page.close();
  b.disconnect();
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
