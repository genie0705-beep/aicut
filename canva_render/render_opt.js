const { chromium } = require('playwright');
const path = require('path');
const dir = __dirname;

const files = [
  ['img01_data.html',    'img01_data.jpg'],
  ['img02_process.html', 'img02_process.jpg'],
  ['img03_compare.html', 'img03_compare.jpg'],
  ['img04_quote.html',   'img04_quote.jpg'],
  ['img05_cta.html',     'img05_cta.jpg'],
  ['blog_card.html',  'img00_cover.jpg'],   // 대표이미지도 JPEG로 재생성
];

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  
  for (const [htmlFile, jpgFile] of files) {
    const p = await ctx.newPage();
    const filePath = 'file:///' + path.join(dir, htmlFile).split(path.sep).join('/');
    await p.goto(filePath, { waitUntil: 'networkidle' });
    await p.waitForTimeout(1500);
    
    const sel = htmlFile.includes('blog_card') ? '.canvas' : '.c';
    const el = await p.$(sel);
    if (el) {
      await el.screenshot({ path: path.join(dir, jpgFile), type: 'jpeg', quality: 85 });
      const stats = require('fs').statSync(path.join(dir, jpgFile));
      console.log('✅ ' + jpgFile + ' (' + (stats.size / 1024).toFixed(0) + 'KB)');
    }
    await p.close();
  }
  
  console.log('\n✅ 모두 JPEG(700×700, quality 85) 재생성 완료!');
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 200)));
