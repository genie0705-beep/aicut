const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page = pages[0];
  if (!page) { page = await b.newPage(); }
  page.on('dialog', async d => { await d.dismiss(); });
  
  await page.goto('https://blog.naver.com/PostView.naver?blogId=aicut&logNo=224341544476', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);
  
  // Analyze current structure
  const data = await page.evaluate(() => {
    const sections = document.querySelectorAll('.se-section, [class*=se-section]');
    const results = [];
    sections.forEach((s, i) => {
      const cls = s.className;
      const isImage = cls.includes('se-section-image');
      const isText = cls.includes('se-section-text');
      const text = (s.textContent || '').replace(/\s+/g, ' ').trim().substring(0, 80);
      const hasImg = s.querySelector('img') !== null;
      const imgCount = s.querySelectorAll('img').length;
      results.push({ idx: i, isImage, isText, hasImg, imgCount, text: text || '(empty)', class: cls.substring(0, 50) });
    });
    return results;
  });
  
  console.log('=== POST STRUCTURE ===');
  data.forEach(d => {
    const type = d.isImage ? '🖼️IMG' : d.isText ? '📝TEXT' : '❓???';
    const imgStatus = d.hasImg ? `✅(${d.imgCount})` : '❌';
    console.log(`${d.idx}: ${type} ${imgStatus} ${d.class.substring(0,40)} | ${d.text.substring(0, 60)}`);
  });
  
  // Check all images
  const imgs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('img')).map((img, i) => {
      return {
        idx: i,
        src: (img.getAttribute('src') || '').substring(0, 80),
        w: img.naturalWidth,
        h: img.naturalHeight,
        loaded: img.complete
      };
    }).filter(ig => ig.w > 0);
  });
  
  console.log('\n=== IMAGES ===');
  imgs.forEach(ig => console.log(`  ${ig.idx}: ${ig.w}x${ig.h} loaded=${ig.loaded} ${ig.src.substring(0,60)}`));
  
  process.exit(0);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
