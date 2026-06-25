const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const dir = __dirname;

const names = [
  'img00_cover',
  'img01_data',
  'img02_process',
  'img03_compare',
  'img04_quote',
  'img05_cta'
];

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  const p = await ctx.newPage();

  const htmlPath = 'file:///' + path.join(dir, 'all_images.html').split('\\').join('/');
  await p.goto(htmlPath, { waitUntil: 'networkidle' });
  await p.waitForTimeout(3000);

  const els = await p.$$('.c');
  console.log('캔버스:', els.length);

  for (let i = 0; i < els.length && i < names.length; i++) {
    const out = path.join(dir, names[i] + '.png');
    await els[i].screenshot({ path: out, type: 'png' });
    const kb = fs.statSync(out).size / 1024;
    console.log('✅ ' + names[i] + '.png (' + kb.toFixed(0) + 'KB)');
  }

  console.log('\n✅ 6장 PNG 생성 완료!');
  await p.close();
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 200)));
