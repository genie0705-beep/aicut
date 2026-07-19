const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const p = await ctx.newPage();
  await p.goto('https://blog.naver.com/aicut/224341544476', { waitUntil: 'networkidle', timeout: 20000 });
  await p.waitForTimeout(4000);

  const frames = p.frames();
  for (const f of frames) {
    if (f.name() === 'mainFrame') {
      const info = await f.evaluate(() => {
        const imgs = document.querySelectorAll('img');
        const bigImgs = Array.from(imgs).filter(i => (i.width || 0) > 100);
        return {
          totalImgs: imgs.length,
          bigImgs: bigImgs.length,
          firstBigSrc: bigImgs.length > 0 ? (bigImgs[0].src || '').substring(0, 80) : 'none',
        };
      });
      console.log(JSON.stringify(info));
      break;
    }
  }

  await p.close();
  await b.close();
})().catch(e => console.log('E:', e.message));
