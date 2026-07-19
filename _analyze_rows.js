const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const W = 'C:\\Users\\paul\\.openclaw\\workspace';

async function fullAnalysis(page, filePath, label) {
  const fullPath = path.join(W, filePath);
  if (!fs.existsSync(fullPath)) return;
  
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
    const g = (x,y) => { const i=(y*W+x)*4; return {r:d[i],g:d[i+1],b:d[i+2]}; };
    
    // Scan every row at center to find all distinct elements
    const xC = Math.floor(W/2);
    const rows = [];
    let lastKey = '';
    for (let y = 0; y < H; y++) {
      const p = g(xC, y);
      const avg = (p.r + p.g + p.b) / 3;
      let key = '';
      if (avg < 30) key = 'DARK';        // gradient bg (dark)
      else if (avg > 220) key = 'WHITE'; // text (white on dark)
      else if (avg > 180) key = 'LIGHT'; // text (dark on light bg)
      else if (p.b > 180 && p.r < 150 && p.g < 150) key = 'PURPLE'; // badge/glow
      else if (p.r > 80 && p.g > 50 && p.b > 150) key = 'CTA'; // purple button
      else if (p.b > 150 && Math.abs(p.r-p.g) < 30) key = 'GLOW'; // glow
      else key = 'MIX';
      
      if (key !== lastKey) {
        rows.push({ y, yPct: Math.round(y/H*100), key, avg: Math.round(avg) });
        lastKey = key;
      }
    }
    
    // Find specific elements
    const badgeRows = rows.filter(r => r.key === 'PURPLE' && r.avg > 100);
    const ctaRows = rows.filter(r => r.key === 'CTA' || (r.key === 'PURPLE' && r.yPct > 50));
    const textRows = rows.filter(r => r.key === 'WHITE' || r.key === 'LIGHT');
    const darkRows = rows.filter(r => r.key === 'DARK');
    
    // Find CTA button more precisely - scan for the gradient button area
    let ctaTop = -1, ctaBottom = -1;
    for (let y = Math.floor(H*0.4); y < H; y++) {
      let purpleCount = 0;
      for (let x = Math.floor(W*0.3); x < Math.floor(W*0.7); x++) {
        const p = g(x, y);
        if (p.b > 150 && p.r > 50 && p.r < 180) purpleCount++;
      }
      if (purpleCount > 40) {
        if (ctaTop === -1) ctaTop = y;
        ctaBottom = y;
      }
    }
    
    return {
      size: `${W}x${H}`,
      rows: rows.filter(r => r.yPct > 5 && r.yPct < 95).slice(0, 30),
      badgeAt: badgeRows.length > 0 ? `${Math.round(badgeRows[badgeRows.length-1].y/H*100)}%` : '?',
      ctaBox: ctaTop >= 0 ? `${Math.round(ctaTop/H*100)}% ~ ${Math.round(ctaBottom/H*100)}%` : '?',
      ctaCenter: ctaTop >= 0 ? `${Math.round((ctaTop+ctaBottom)/2/H*100)}%` : '?',
      firstTextAt: textRows.length > 0 ? `${textRows[0].yPct}%` : '?',
      lastTextAt: textRows.length > 0 ? `${textRows[textRows.length-1].yPct}%` : '?',
      lastDarkBelow: darkRows.length > 0 ? `${darkRows[darkRows.length-1].yPct}%` : '?',
    };
  });
  
  console.log(`\n=== ${label} (${data.size}) ===`);
  console.log(`배지: ${data.badgeAt}`);
  console.log(`첫 텍스트: ${data.firstTextAt} / 마지막 텍스트: ${data.lastTextAt}`);
  console.log(`CTA 박스: ${data.ctaBox} (중앙: ${data.ctaCenter})`);
  console.log(`마지막 어두운영역(하단여백끝): ${data.lastDarkBelow}`);
}

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  await fullAnalysis(page, '_ref_aicut_blog_worker.png', 'REF-main');
  await fullAnalysis(page, '_ref_aicut_body_worker_cycle.png', 'REF-cycle');
  await fullAnalysis(page, '_ref_aicut_body_worker_cost.png', 'REF-cost');
  
  console.log('\n--- 차이 분석 ---');
  await fullAnalysis(page, 'aicut_blog_estate_main.png', 'OUR-main');
  await fullAnalysis(page, 'aicut_blog_estate_cycle.png', 'OUR-cycle');
  await fullAnalysis(page, 'aicut_blog_estate_cost.png', 'OUR-cost');

  await page.close();
  await b.close();
})();
