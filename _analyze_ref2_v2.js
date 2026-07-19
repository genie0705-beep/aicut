const { chromium } = require('playwright');
const fs = require('fs');
const https = require('https');
const path = require('path');
const W = 'C:\\Users\\paul\\.openclaw\\workspace';

function download(url, dest) {
  return new Promise((resolve) => {
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(fs.statSync(dest).size); });
    }).on('error', () => resolve(0));
  });
}

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  await page.goto('https://blog.naver.com/PostView.naver?blogId=aicut&logNo=224321668804', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(3000);
  
  const frames = page.frames();
  let mf = frames.find(f => f.url().includes('PostView'));
  if (!mf) mf = frames[0];
  
  // Get COMPLETE image URLs
  const fullUrls = await mf.evaluate(() => {
    return Array.from(document.querySelectorAll('.se-image-resource')).map(img => {
      let src = img.getAttribute('data-lazy-src') || img.src;
      // Get full resolution
      return src.replace(/type=w\d+.*$/, 'type=w966');
    }).filter(s => !s.includes('profile'));
  });
  
  console.log('Full URLs:');
  for (const url of fullUrls) {
    console.log(url);
  }
  
  // Download each image
  const names = ['thumb', '01', '02', '03', 'cta'];
  for (let i = 0; i < Math.min(fullUrls.length, names.length); i++) {
    const dest = path.join(W, `_ref2_${names[i]}.png`);
    const size = await download(fullUrls[i], dest);
    console.log(`  ${names[i]}: ${Math.round(size/1024)}KB`);
  }
  
  await page.close();
  await b.close();
  
  console.log('\n=== 이미지 분석 ===');
  const b2 = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx2 = b2.contexts()[0];
  const p2 = await ctx2.newPage();
  
  async function analyze(label, file) {
    const fp = path.join(W, file);
    if (!fs.existsSync(fp) || fs.statSync(fp).size < 100) { console.log(`${label}: 파일 없음`); return; }
    await p2.goto('file:///'+fp.replace(/\\/g,'/'), {waitUntil:'networkidle',timeout:10000});
    await p2.waitForTimeout(500);
    const d = await p2.evaluate(() => {
      const img = document.querySelector('img');
      const W = img.naturalWidth, H = img.naturalHeight;
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const ctx = c.getContext('2d'); ctx.drawImage(img,0,0);
      const g = (x,y) => { const i=(y*W+x)*4; return {r:i<10000?0:0,g:0,b:0}; };  // dummy
      // Get corner colors directly
      const d2 = ctx.getImageData(0,0,W,H).data;
      const gc = (x,y) => { const i=(y*W+x)*4; return {r:d2[i],g:d2[i+1],b:d2[i+2]}; };
      return {
        size: `${W}x${H}`,
        bg: { tl: gc(5,5), tr: gc(W-5,5), bl: gc(5,H-5), br: gc(W-5,H-5) }
      };
    });
    console.log(`${label} (${d.size}): 상단좌=${JSON.stringify(d.bg.tl)} 상단우=${JSON.stringify(d.bg.tr)} 하단좌=${JSON.stringify(d.bg.bl)} 하단우=${JSON.stringify(d.bg.br)}`);
  }
  
  await analyze('thumb', '_ref2_thumb.png');
  await analyze('01', '_ref2_01.png');
  await analyze('02', '_ref2_02.png');
  await analyze('03', '_ref2_03.png');
  await analyze('cta', '_ref2_cta.png');
  
  await p2.close(); await b2.close();
})();
