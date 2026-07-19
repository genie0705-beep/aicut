const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const W = 'C:\\Users\\paul\\.openclaw\\workspace';

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  const refImages = [
    '_ref_aicut_blog_worker.png',
    '_ref_aicut_body_worker_cycle.png',
    '_ref_aicut_body_worker_cost.png',
    '_ref_aicut_body_worker_after.png'
  ];
  
  for (const imgFile of refImages) {
    const fullPath = path.join(W, imgFile);
    await page.goto('file:///' + fullPath.replace(/\\/g, '/'), { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(1000);
    
    // Analyze colors
    const colors = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = document.body.clientWidth;
      canvas.height = document.body.clientHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(document.querySelector('img'), 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Get corner and center colors
      const getColor = (x, y) => {
        const idx = (y * canvas.width + x) * 4;
        return `rgb(${data[idx]},${data[idx+1]},${data[idx+2]})`;
      };
      
      return {
        size: `${canvas.width}x${canvas.height}`,
        topLeft: getColor(10, 10),
        topRight: getColor(canvas.width-10, 10),
        center: getColor(Math.floor(canvas.width/2), Math.floor(canvas.height/2)),
        bottomLeft: getColor(10, canvas.height-10),
        bottomRight: getColor(canvas.width-10, canvas.height-10)
      };
    });
    
    console.log(`${imgFile}:`, JSON.stringify(colors));
  }
  
  await page.close();
  await b.close();
})();
