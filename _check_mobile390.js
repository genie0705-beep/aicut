const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page = pages[0];
  if (!page) { page = await b.newPage(); }
  page.on('dialog', async d => { await d.dismiss(); });
  
  // Set mobile viewport (iPhone 14 Pro)
  await page.setViewportSize({ width: 390, height: 844 });
  
  await page.goto('https://m.blog.naver.com/aicut/224350581299', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  const mobile = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    const results = [];
    imgs.forEach((img, i) => {
      if (img.naturalWidth > 50) {
        const rect = img.getBoundingClientRect();
        const viewportW = window.innerWidth;
        const imgCenter = rect.left + rect.width / 2;
        const vpCenter = viewportW / 2;
        const offset = Math.abs(imgCenter - vpCenter);
        results.push({
          idx: i,
          w: img.naturalWidth,
          h: img.naturalHeight,
          displayW: Math.round(rect.width),
          displayH: Math.round(rect.height),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          vpW: viewportW,
          offset: Math.round(offset),
          perfectCenter: offset < 2 ? '✅' : (offset < 20 ? '⚠️' : '❌')
        });
      }
    });
    return results;
  });
  
  console.log('=== MOBILE (390px) ALIGNMENT ===');
  mobile.forEach(m => console.log(`${m.perfectCenter} Img${m.idx}: ${m.w}x${m.h} → display ${m.displayW}x${m.displayH} | left=${m.left} right=${m.right} | vp=${m.vpW} | offset=${m.offset}px`));
  
  process.exit(0);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
