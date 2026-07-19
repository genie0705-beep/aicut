const { chromium } = require('playwright');
const fs = require('fs');
const https = require('https');
const path = require('path');
const W = 'C:\\Users\\paul\\.openclaw\\workspace';

function download(url, dest) {
  return new Promise((resolve) => {
    const file = fs.createWriteStream(dest);
    https.get(url, res => { res.pipe(file); file.on('finish', () => { file.close(); resolve(fs.statSync(dest).size); }); })
      .on('error', () => resolve(0));
  });
}

async function analyze(page, filePath, label) {
  const fp = path.join(W, filePath);
  if (!fs.existsSync(fp)) return;
  await page.goto('file:///'+fp.replace(/\\/g,'/'), {waitUntil:'networkidle',timeout:10000});
  await page.waitForTimeout(500);
  
  const d = await page.evaluate(() => {
    const img = document.querySelector('img');
    const W = img.naturalWidth, H = img.naturalHeight;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const ctx = c.getContext('2d'); ctx.drawImage(img,0,0);
    const data = ctx.getImageData(0,0,W,H).data;
    const g = (x,y) => { const i=(y*W+x)*4; return {r:data[i],g:data[i+1],b:data[i+2]}; };
    
    const xC = Math.floor(W/2);
    // Detect color zones along center
    const zones = [];
    let lastKey = '';
    for (let y=0; y<H; y+=2) {
      const p = g(xC, y);
      let key = 'BG';
      if (p.r>200 && p.g>200 && p.b>200) key = 'WHITE';
      else if (p.r<50 && p.g<50 && p.b<80) key = 'DARK';
      else if (p.b>150 && p.r<150) key = 'PURPLE';
      else if (p.g>150 && p.r<100) key = 'GREEN';
      else if (p.r>150 && p.g<100) key = 'PINK';
      else if (p.r>150 && p.g>150 && p.b<100) key = 'YELLOW';
      if (key !== lastKey) { zones.push({y,pct:Math.round(y/H*100),key}); lastKey=key; }
    }
    
    // Top/bottom padding (dark bg area)
    const topPad = zones.filter(z => z.key==='DARK' && z.pct<30);
    const botPad = zones.filter(z => z.key==='DARK' && z.pct>50);
    
    return {
      size: `${W}x${H}`,
      zones: zones.filter(z => z.pct>5 && z.pct<95).slice(0,15),
      bgColors: { top: g(10,10), center: g(Math.floor(W/2),Math.floor(H/2)), bottom: g(W-10,H-10) },
      topDarkPct: topPad.length > 0 ? topPad[topPad.length-1].pct : 0,
      botDarkPct: botPad.length > 0 ? botPad[0].pct : 100,
    };
  });
  
  console.log(`\n=== ${label} (${d.size}) ===`);
  console.log(`배경: 상단=${JSON.stringify(d.bgColors.top)} 중앙=${JSON.stringify(d.bgColors.center)} 하단=${JSON.stringify(d.bgColors.bottom)}`);
  console.log(`상단여백: ${d.topDarkPct}% / 하단여백: ${100-d.botDarkPct}%`);
  console.log(`색상대: ${d.zones.map(z=>z.pct+'%'+z.key).join(' → ')}`);
}

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  // Download ref images
  const urls = [
    ['https://postfiles.pstatic.net/MjAyNjA2MjBfMTcg/MDAxNzgxOTI0OTQ4NjY3.0ldKQrqGJJp6g-T0sA-xbCnqWgbqPkkK8tJFT6xHmNsg.EVv6rtI7O8pbABfNVUG5_8V3Vq2s4E9vFpFSDibHAdIg.PNG/aicut_blog_freelancer_thumb.png?type=w966', '_ref2_thumb.png'],
    ['https://postfiles.pstatic.net/MjAyNjA2MjBfOTgg/MDAxNzgxOTI0OTUzMjg4.YXGjmOd2yBmJ9nqILCCY3lE5U8WIP7SiPsOFj5ZqAdkg._cs3r0OXyFqGIIBzrrKjq1yDW8bGQf7hLIHdNDdlr5Eg.PNG/aicut_blog_freelancer_01.png?type=w966', '_ref2_01.png'],
    ['https://postfiles.pstatic.net/MjAyNjA2MjBfODEg/MDAxNzgxOTI0OTU3NjYy.83vVzB5P7Tv85tBDBPYQl5yJQcBqkLE6fjA5X5ScA4Ag.IHkmB8Jw9LqzDzzKzNYy2gXPjHM4BLc0iMWoWG3SKEIg.PNG/aicut_blog_freelancer_02.png?type=w966', '_ref2_02.png'],
    ['https://postfiles.pstatic.net/MjAyNjA2MjBfNDcg/MDAxNzgxOTI0OTYyNjMx.pQ6AAgysQQMiFnzMYl8OqMfT0SipbBAs4TMf6nCE4-Mg.QQA9AF6gFDs_x4UNpixqo_dQ2NynDscLg10Rf_ts3cEg.PNG/aicut_blog_freelancer_03.png?type=w966', '_ref2_03.png'],
    ['https://postfiles.pstatic.net/MjAyNjA2MjBfMTkz/MDAxNzgxOTI0OTY3NTQ0.xmszYnLs8SAqlT5kMtPnYj0kW5BdFuFQZ8YsFmRpmKgg.xXlQ9RMCkvy7w7TR9OYTmkYRxtXbHP3RkYX_2vL-KW0g.PNG/aicut_blog_freelancer_cta.png?type=w966', '_ref2_cta.png'],
  ];
  
  console.log('=== 이미지 다운로드 ===');
  for (const [url, name] of urls) {
    const size = await download(url, path.join(W, name));
    console.log(`  ${name}: ${Math.round(size/1024)}KB`);
  }
  
  console.log('\n=== 이미지 분석 ===');
  await analyze(page, '_ref2_thumb.png', 'thumb(대표)');
  await analyze(page, '_ref2_01.png', 'card-01');
  await analyze(page, '_ref2_02.png', 'card-02');
  await analyze(page, '_ref2_03.png', 'card-03');
  await analyze(page, '_ref2_cta.png', 'cta');
  
  await page.close();
  await b.close();
})();
