const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const W = 'C:\\Users\\paul\\.openclaw\\workspace';

async function analyzeImage(page, filePath, label) {
  const fp = path.join(W, filePath);
  if (!fs.existsSync(fp)) { console.log(`${label}: 파일 없음`); return null; }
  
  await page.goto('file:///'+fp.replace(/\\/g,'/'), {waitUntil:'networkidle', timeout:10000});
  await page.waitForTimeout(500);
  
  return await page.evaluate(() => {
    const img = document.querySelector('img');
    const W = img.naturalWidth, H = img.naturalHeight;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, W, H).data;
    
    const get = (x, y) => {
      const i = (y * W + x) * 4;
      return { r: d[i], g: d[i+1], b: d[i+2] };
    };
    
    const isText = (p) => (p.r + p.g + p.b) / 3 > 200;  // white text on dark
    const isBadge = (p) => p.b > 150 && p.r > 100 && p.r < 190;
    const isCTA = (p) => p.b > 160 && p.r > 40 && p.r < 180;
    const isBg = (p) => (p.r + p.g + p.b) / 3 < 40;  // dark bg
    
    // Scan center X for vertical layout
    const xC = Math.floor(W / 2);
    
    // Find all element boundaries
    // Scan row by row, classify each row
    const zones = [];
    let lastType = '';
    let startY = 0;
    
    for (let y = 0; y < H; y++) {
      let textCount = 0, badgeCount = 0, ctaCount = 0, bgCount = 0;
      for (let x = Math.floor(W*0.2); x < Math.floor(W*0.8); x++) {
        const p = get(x, y);
        if (isText(p)) textCount++;
        if (isBadge(p)) badgeCount++;
        if (isCTA(p)) ctaCount++;
        if (isBg(p)) bgCount++;
      }
      
      const threshold = Math.floor(W*0.15);
      let type = 'PADDING';
      if (textCount > threshold) type = 'TEXT';
      else if (ctaCount > 15) type = 'CTA';
      else if (badgeCount > 5) type = 'BADGE';
      
      if (type !== lastType) {
        if (lastType && startY < y) {
          zones.push({ type: lastType, yStart: startY, yEnd: y, height: y - startY, yPct: Math.round(startY/H*100) });
        }
        startY = y;
        lastType = type;
      }
    }
    if (lastType && startY < H) {
      zones.push({ type: lastType, yStart: startY, yEnd: H, height: H - startY, yPct: Math.round(startY/H*100) });
    }
    
    // Detect theme by corner colors
    const tl = get(5, 5);
    const br = get(W-5, H-5);
    
    // Estimate font size: measure height of a text line
    const textZones = zones.filter(z => z.type === 'TEXT');
    let estimatedFontSize = 0;
    if (textZones.length > 0) {
      // The smallest text zone height is likely one line of text
      const minTextH = Math.min(...textZones.map(z => z.height));
      // Font size ≈ text line height / 1.35 (line-height)
      estimatedFontSize = Math.round(minTextH / 1.35);
    }
    
    // Calculate gaps between elements
    const elementZones = zones.filter(z => z.type !== 'PADDING');
    const gaps = [];
    for (let i = 1; i < elementZones.length; i++) {
      const prev = elementZones[i-1];
      const curr = elementZones[i];
      if (curr.yStart > prev.yEnd) {
        gaps.push({ between: `${prev.type}→${curr.type}`, gap: curr.yStart - prev.yEnd });
      }
    }
    
    // Calculate total content height from first element to last
    const firstEl = elementZones[0];
    const lastEl = elementZones[elementZones.length - 1];
    const contentH = lastEl ? (lastEl.yEnd - firstEl.yStart) : 0;
    const topPad = firstEl ? firstEl.yStart : 0;
    const botPad = lastEl ? (H - lastEl.yEnd) : 0;
    
    return {
      size: `${W}x${H}`,
      bgColors: { tl, br },
      zones: zones.filter(z => z.type !== 'PADDING'),
      gapAnalysis: gaps,
      estimatedFontSizes: {
        minTextLineH: Math.min(...textZones.map(z => z.height)),
        maxTextLineH: Math.max(...textZones.map(z => z.height)),
        estimatedFontMain: estimatedFontSize,
      },
      padding: {
        top: topPct = Math.round(topPad/H*100),
        bottom: Math.round(botPad/H*100),
        content: Math.round(contentH/H*100)
      }
    };
  });
}

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  const imgs = [
    ['_ref_aicut_blog_worker.png', 'REF-main (700x700 기준 대표)'],
    ['_ref2_thumb.png', 'REF2-thumb (800x450 기준)'],
    ['_ref2_01.png', 'REF2-01'],
    ['_ref2_02.png', 'REF2-02'],
    ['_ref2_03.png', 'REF2-03'],
    ['_ref2_cta.png', 'REF2-cta'],
  ];
  
  for (const [file, label] of imgs) {
    const r = await analyzeImage(page, file, label);
    if (!r) continue;
    console.log(`\n=== ${label} (${r.size}) ===`);
    console.log(`배경: 상단=rgb(${r.bgColors.tl.r},${r.bgColors.tl.g},${r.bgColors.tl.b}) 하단=rgb(${r.bgColors.br.r},${r.bgColors.br.g},${r.bgColors.br.b})`);
    console.log(`상단여백: ${r.padding.top}%  |  하단여백: ${r.padding.bottom}%  |  콘텐츠영역: ${r.padding.content}%`);
    console.log(`요소:`);
    r.zones.forEach(z => console.log(`  ${z.type}: y=${z.yPct}% (${z.yStart}~${z.yEnd}, 높이=${z.height}px)`));
    if (r.gapAnalysis.length > 0) {
      console.log(`간격(GAP):`);
      r.gapAnalysis.forEach(g => {
        const gapPct = Math.round(g.gap / parseInt(r.size.split('x')[1]) * 100);
        console.log(`  ${g.between}: ${g.gap}px (${gapPct}%)`);
      });
    }
    if (r.estimatedFontSizes) {
      console.log(`추정 폰트: main≈${r.estimatedFontSizes.estimatedFontMain}px (라인높이 ${r.estimatedFontSizes.minTextLineH}px)`);
    }
  }
  
  await page.close();
  await b.close();
})();
