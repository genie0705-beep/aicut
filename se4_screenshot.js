const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  const wp = pages[2] || pages.find(p => p.url().includes('Redirect=Write'));
  if (!wp) { console.log('NO PAGE'); await b.close(); return; }
  await wp.bringToFront(); await sleep(2000);
  
  const frames = wp.frames();
  for (const f of frames) {
    if (f.url().includes('PostWriteForm')) {
      const el = await wp.$('iframe');
      if (el) {
        const box = await el.boundingBox();
        if (box) {
          await wp.screenshot({
            path: 'C:\\Users\\paul\\.openclaw\\workspace\\blog_done.png',
            clip: { x: box.x, y: box.y, width: Math.min(box.width, 1200), height: Math.min(box.height, 2000) }
          });
          console.log('✅ 스크린샷 저장 완료');
        }
      }
      break;
    }
  }
  
  await b.close();
})();
