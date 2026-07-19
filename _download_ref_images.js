const { chromium } = require('playwright');
const fs = require('fs');
const https = require('https');
const path = require('path');

const W = 'C:\\Users\\paul\\.openclaw\\workspace';

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, res => {
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(fs.statSync(dest).size); });
    }).on('error', e => { fs.unlinkSync(dest); reject(e); });
  });
}

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  
  const page = await ctx.newPage();
  await page.goto('https://blog.naver.com/PostView.naver?blogId=aicut&logNo=224320657442', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(3000);
  
  const frames = page.frames();
  let mf = frames.find(f => f.url().includes('PostView'));
  if (!mf) mf = frames[0];
  
  // Get full-size image URLs
  const imgData = await mf.evaluate(() => {
    const imgs = document.querySelectorAll('.se-image-resource');
    return Array.from(imgs).slice(0, 5).map(img => {
      let src = img.src;
      // Get full res URL (remove size params)
      src = src.replace(/type=w\d+.*$/, 'type=w966');
      return {
        fullSrc: src,
        name: new URL(src).pathname.split('/').pop()
      };
    }).filter(i => !i.name.includes('profile'));
  });
  
  console.log('Ref images:', JSON.stringify(imgData, null, 2));
  
  // Download each image for analysis
  for (const img of imgData) {
    const dest = path.join(W, '_ref_' + img.name);
    try {
      const size = await download(img.fullSrc, dest);
      console.log(`Downloaded ${img.name} (${Math.round(size/1024)}KB)`);
    } catch(e) {
      console.log(`Failed ${img.name}: ${e.message}`);
    }
  }
  
  // Take full screenshot
  await page.screenshot({ path: '_ref_fullpage.png', fullPage: true });
  console.log('Screenshot saved');
  
  await page.close();
  await b.close();
  
  // Now check the color/style of the images
  console.log('\n=== 다운로드 완료 ===');
})();
