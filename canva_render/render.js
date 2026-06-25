const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  const p = await ctx.newPage();

  const absPath = path.resolve(__dirname, 'blog_card.html');
  await p.goto('file:///' + absPath.split(path.sep).join('/'), { waitUntil: 'networkidle' });
  await p.waitForTimeout(2000);

  const el = await p.$('.canvas');
  if (el) {
    await el.screenshot({ path: path.join(__dirname, 'output_blog_card.png') });
    console.log('✅ 이미지 저장 완료');
  } else {
    console.log('요소 없음');
    await p.screenshot({ path: path.join(__dirname, 'debug.png') });
  }
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 200)));
