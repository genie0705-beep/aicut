const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const DIR = __dirname + '/insta_cards';
const CARD = { html: 'card_5q.html', out: 'card_5q_checklist.png' };

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const page = await b.contexts()[0].newPage();
  await page.setViewportSize({ width: 1080, height: 1080 });
  
  const filePath = 'file:///' + DIR + '/' + CARD.html;
  console.log('Loading:', filePath);
  await page.goto(filePath, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  
  const outPath = path.join(DIR, CARD.out);
  await page.screenshot({ path: outPath, fullPage: false });
  const size = fs.statSync(outPath).size;
  console.log('✅', CARD.out, `(${(size/1024).toFixed(0)}KB)`);
  
  await page.close();
  b.close();
  console.log('Done!');
})().catch(e => console.error('Fatal:', e.message));
