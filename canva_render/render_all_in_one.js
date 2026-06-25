const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const dir = __dirname;

const outputNames = [
  'img00_cover',
  'img01_data',
  'img02_process',
  'img03_compare',
  'img04_quote',
  'img05_cta'
];
const ext = 'png';

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  const p = await ctx.newPage();

  const filePath = 'file:///' + path.join(dir, 'all_images.html').split(path.sep).join('/');
  await p.goto(filePath, { waitUntil: 'networkidle' });
  await p.waitForTimeout(3000);

  const canvases = await p.$$('.c');
  console.log('캔버스 개수:', canvases.length);

  for (let i = 0; i < canvases.length && i < outputNames.length; i++) {
    const outPath = path.join(dir, outputNames[i] + '.jpg');
    await canvases[i].screenshot({ path: outPath, type: 'jpeg', quality: 85 });
    const size = fs.statSync(outPath).size;
    console.log('✅ ' + outputNames[i] + '. + (size / 1024).toFixed(0) + 'KB)');
  }

  console.log('\n✅ 6장 모두 생성 완료!');
  await p.close();
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 200)));
