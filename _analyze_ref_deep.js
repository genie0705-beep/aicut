const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const W = 'C:\\Users\\paul\\.openclaw\\workspace';

async function analyzeImage(page, filePath, label) {
  const fullPath = path.join(W, filePath);
  if (!fs.existsSync(fullPath)) { console.log(`${filePath}: 파일 없음`); return; }
  
  await page.goto('file:///' + fullPath.replace(/\\/g, '/'), { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForTimeout(500);
  
  const data = await page.evaluate(() => {
    const img = document.querySelector('img');
    const c = document.createElement('canvas');
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const W = c.width, H = c.height;
    const d = ctx.getImageData(0, 0, W, H).data;
    
    const getRgb = (x, y) => {
      const i = (y * W + x) * 4;
      return { r: d[i], g: d[i+1], b: d[i+2], a: d[i+3] };
    };
    const isSimilar = (c1, c2, t=30) => Math.abs(c1.r-c2.r)<t && Math.abs(c1.g-c2.g)<t && Math.abs(c1.b-c2.b)<t;
    const rgbKey = (c) => `${Math.round(c.r/10)*10},${Math.round(c.g/10)*10},${Math.round(c.b/10)*10}`;
    
    // Scan vertically at center to find element boundaries
    const xCenter = Math.floor(W / 2);
    const colorChanges = [];
    let lastKey = null;
    for (let y = 0; y < H; y += 2) {
      const p = getRgb(xCenter, y);
      const key = rgbKey(p);
      if (key !== lastKey) {
        colorChanges.push({ y, key, r: p.r, g: p.g, b: p.b });
        lastKey = key;
      }
    }
    
    // Find badge area (typically near top)
    const badgeColors = ['a78bfa', 'a78bfa']; // purple
    const badgeAreas = colorChanges.filter(c => c.r > 140 && c.g > 100 && c.b > 200);
    
    // Detect text areas (lighter on dark bg, darker on light bg)
    const textAreas = colorChanges.filter(c => c.r > 200 && c.g > 200 && c.b > 200);
    const darkAreas = colorChanges.filter(c => c.r < 50 && c.g < 50 && c.b < 80);
    
    return {
      size: `${W}x${H}`,
      totalColorChanges: colorChanges.length,
      colorProfile: colorChanges.slice(0, 20),
      textAreas: textAreas.slice(0, 10).map(a => ({ y: a.y, yPct: Math.round(a.y/H*100) })),
      darkAreas: darkAreas.slice(0, 10).map(a => ({ y: a.y, yPct: Math.round(a.y/H*100) })),
      // Check if bg is gradient or solid
      topColor: getRgb(10, 10),
      bottomColor: getRgb(W-10, H-10),
      centerColor: getRgb(Math.floor(W/2), Math.floor(H/2)),
      // Scan for the badge (purple-ish text)
      badgeCandidates: badgeAreas.slice(0, 5).map(a => ({ y: a.y, yPct: Math.round(a.y/H*100), rgb: `${a.r},${a.g},${a.b}` })),
    };
  });
  
  console.log(`\n=== ${label} (${data.size}) ===`);
  console.log(`배경: top=${JSON.stringify(data.topColor)} bottom=${JSON.stringify(data.bottomColor)} center=${JSON.stringify(data.centerColor)}`);
  console.log(`색상 변화 포인트: ${data.totalColorChanges}개`);
  console.log('텍스트 영역(y%):', data.textAreas.map(t=>t.yPct+'%').join(', '));
  console.log('어두운 영역(y%):', data.darkAreas.map(t=>t.yPct+'%').join(', '));
  if (data.badgeCandidates.length > 0) console.log('배지 후보(y%):', data.badgeCandidates.map(t=>t.yPct+'%').join(', '));
}

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  // Analyze reference images
  await analyzeImage(page, '_ref_aicut_blog_worker.png', 'REF - 메인');
  await analyzeImage(page, '_ref_aicut_body_worker_cycle.png', 'REF - cycle');
  await analyzeImage(page, '_ref_aicut_body_worker_cost.png', 'REF - cost');
  await analyzeImage(page, '_ref_aicut_body_worker_after.png', 'REF - after');
  
  // Analyze our current images for comparison
  await analyzeImage(page, 'aicut_blog_estate_main.png', 'OUR - 메인');
  await analyzeImage(page, 'aicut_blog_estate_cycle.png', 'OUR - cycle');

  await page.close();
  await b.close();
})();
