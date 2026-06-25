const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  const p = await ctx.newPage();

  const dir = __dirname;
  const htmlPath = 'file:///' + path.join(dir, 'blog_inline_cards.html').split(path.sep).join('/');
  await p.goto(htmlPath, { waitUntil: 'networkidle' });
  await p.waitForTimeout(2000);

  // Find all canvas elements
  const canvases = await p.$$('.canvas');
  console.log('캔버스 개수:', canvases.length);

  const names = [
    '01_data_visual',
    '02_3step_process',
    '03_comparison',
    '04_quote_highlight',
    '05_cta_end'
  ];

  for (let i = 0; i < canvases.length && i < names.length; i++) {
    const filePath = path.join(dir, names[i] + '.png');
    await canvases[i].screenshot({ path: filePath });
    console.log((i+1) + '/' + names.length + ' 완료: ' + names[i] + '.png');
  }

  console.log('✅ 5장 모두 생성 완료!');
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 200)));
