const { chromium } = require('playwright');
const path = require('path');
const dir = __dirname;

const files = [
  ['img01_data.html',    'img01_data.png'],
  ['img02_process.html', 'img02_process.png'],
  ['img03_compare.html', 'img03_compare.png'],
  ['img04_quote.html',   'img04_quote.png'],
  ['img05_cta.html',     'img05_cta.png'],
];

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  
  for (const [htmlFile, pngFile] of files) {
    const p = await ctx.newPage();
    const filePath = 'file:///' + path.join(dir, htmlFile).split(path.sep).join('/');
    await p.goto(filePath, { waitUntil: 'networkidle' });
    await p.waitForTimeout(1500);
    const el = await p.$('.c');
    if (el) {
      await el.screenshot({ path: path.join(dir, pngFile) });
      console.log('✅ ' + pngFile);
    }
    await p.close();
  }
  
  console.log('\n✅ 5장 모두 정사각형(1080×1080) 재생성 완료!');
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 200)));
