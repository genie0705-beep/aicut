const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const dir = __dirname;

const files = [
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

  for (const name of files) {
    const p = await ctx.newPage();
    const htmlPath = 'file:///' + path.join(dir, name + '.html').split('\\').join('/');
    await p.goto(htmlPath, { waitUntil: 'networkidle' });
    await p.waitForTimeout(2000);
    const el = await p.$('.wrap');
    if (el) {
      const out = path.join(dir, name + '.png');
      await el.screenshot({ path: out, type: 'png' });
      const kb = fs.statSync(out).size / 1024;
      console.log('✅ ' + name + '.png (' + kb.toFixed(0) + 'KB)');
    }
    await p.close();
  }

  console.log('\n✅ 6장 개별 PNG 생성 완료!');
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 200)));
