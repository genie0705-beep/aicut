const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const W = 'C:\\Users\\paul\\.openclaw\\workspace';

async function preciseAnalyze(page, filePath, label) {
  const fullPath = path.join(W, filePath);
  if (!fs.existsSync(fullPath)) { console.log(`${label}: 파일 없음`); return; }
  
  await page.goto('file:///' + fullPath.replace(/\\/g, '/'), { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForTimeout(500);
  
  const data = await page.evaluate(() => {
    const img = document.querySelector('img');
    const W = img.naturalWidth, H = img.naturalHeight;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, W, H).data;
    
    const getPx = (x, y) => {
      const i = (y * W + x) * 4;
      return { r: d[i], g: d[i+1], b: d[i+2], a: d[i+3] };
    };
    
    const isBright = (p) => (p.r + p.g + p.b) / 3 > 180;
    const isDark = (p) => (p.r + p.g + p.b) / 3 < 50;
    const isPurple = (p) => p.b > p.r + 30 && p.b > p.g + 30;
    const isGlow = (p) => p.b > 150 && p.r < 100;
    
    // Scan vertical center line - find all horizontal runs of text
    const xC = Math.floor(W / 2);
    
    // Find text rows by scanning for areas where bright pixels cluster
    const textRows = [];
    let inText = false;
    let textStart = 0;
    
    for (let y = 0; y < H; y++) {
      let brightCount = 0;
      for (let x = Math.floor(W*0.2); x < Math.floor(W*0.8); x++) {
        const p = getPx(x, y);
        if (isBright(p)) brightCount++;
      }
      const isTextLine = brightCount > Math.floor(W*0.2);
      
      if (isTextLine && !inText) { inText = true; textStart = y; }
      else if (!isTextLine && inText) {
        textRows.push({ start: textStart, end: y, height: y - textStart, centerPct: Math.round((textStart + y) / 2 / H * 100) });
        inText = false;
      }
    }
    if (inText) textRows.push({ start: textStart, end: H-1, height: H - textStart, centerPct: Math.round((textStart + H-1) / 2 / H * 100) });
    
    // Find the badge (small purple box at top)
    let badgeY = -1;
    for (let y = Math.floor(H*0.05); y < Math.floor(H*0.35); y++) {
      let count = 0;
      for (let x = Math.floor(W*0.3); x < Math.floor(W*0.7); x++) {
        const p = getPx(x, y);
        if (p.b > 150 && p.r < 130 && p.g < 130) count++;
      }
      if (count > 20) { badgeY = y; break; }
    }
    
    // Find CTA button (gradient box at bottom)
    let ctaY = -1;
    for (let y = Math.floor(H*0.6); y < H; y++) {
      let count = 0;
      for (let x = Math.floor(W*0.3); x < Math.floor(W*0.7); x++) {
        const p = getPx(x, y);
        if (p.r > 50 && p.g > 30 && p.b > 180 && p.r < 150) count++;
        if (p.r > 80 && p.g > 50 && p.b > 150) count++;
      }
      if (count > 50) { ctaY = y; break; }
    }
    
    // Find top and bottom padding by scanning for first and last non-gradient pixel rows
    let topContent = 0;
    for (let y = 0; y < H; y++) {
      const p = getPx(xC, y);
      if (isBright(p) || isPurple(p)) { topContent = y; break; }
    }
    
    let bottomContent = H - 1;
    for (let y = H - 1; y >= 0; y--) {
      const p = getPx(xC, y);
      if (isBright(p) || getPx(Math.floor(W*0.3), y).b > 140) { bottomContent = y; break; }
    }
    
    return {
      size: `${W}x${H}`,
      textRows: textRows.map(r => ({ yPct: `${r.centerPct}%`, height: r.height })),
      badgeDetectedY: badgeY >= 0 ? `${Math.round(badgeY/H*100)}%` : 'not found',
      ctaDetectedY: ctaY >= 0 ? `${Math.round(ctaY/H*100)}%` : 'not found',
      topContentY: `${Math.round(topContent/H*100)}%`,
      bottomContentY: `${Math.round(bottomContent/H*100)}%`,
      contentArea: `${Math.round((bottomContent-topContent)/H*100)}%`,
      topPadding: `${Math.round(topContent/H*100)}%`,
      bottomPadding: `${Math.round((H-1-bottomContent)/H*100)}%`,
      // Gradient check
      topLeftColor: getPx(5, 5),
      bottomRightColor: getPx(W-5, H-5),
    };
  });
  
  console.log(`\n=== ${label} (${data.size}) ===`);
  console.log(`배경: top=${JSON.stringify(data.topLeftColor)} bottom=${JSON.stringify(data.bottomRightColor)}`);
  console.log(`상단여백: ${data.topPadding} / 하단여백: ${data.bottomPadding} / 콘텐츠영역: ${data.contentArea}`);
  console.log(`텍스트 라인(y%): ${data.textRows.map(t=>t.yPct).join(' → ')}`);
  console.log(`배지(y%): ${data.badgeDetectedY} / CTA(y%): ${data.ctaDetectedY}`);
}

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  // REF images
  await preciseAnalyze(page, '_ref_aicut_blog_worker.png', 'REF-main');
  await preciseAnalyze(page, '_ref_aicut_body_worker_cycle.png', 'REF-cycle');
  await preciseAnalyze(page, '_ref_aicut_body_worker_cost.png', 'REF-cost');
  await preciseAnalyze(page, '_ref_aicut_body_worker_after.png', 'REF-after');
  
  console.log('\n' + '='.repeat(60));
  
  // Current images (latest generation)
  await preciseAnalyze(page, 'aicut_blog_estate_main.png', 'OUR-main');
  await preciseAnalyze(page, 'aicut_blog_estate_cycle.png', 'OUR-cycle');
  
  await page.close();
  await b.close();
})();
