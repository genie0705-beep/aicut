const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  page.on('dialog', async d => d.dismiss());

  await page.goto('https://admin.blog.naver.com/aicut/stat/today', {
    waitUntil: 'domcontentloaded', timeout: 20000
  });
  await page.waitForTimeout(10000);

  if (page.url().includes('nid.naver.com')) {
    console.log('로그인 필요');
    return;
  }

  // 모든 프레임의 텍스트 수집
  const frames = page.frames();
  console.log(`프레임: ${frames.length}개\n`);

  for (let fi = 0; fi < frames.length; fi++) {
    const f = frames[fi];
    try {
      const text = await f.evaluate(() => {
        const body = document.body;
        if (!body) return '';
        // Get all text nodes
        const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, null, false);
        let texts = [];
        let node;
        while (node = walker.nextNode()) {
          const t = node.textContent.trim();
          if (t.length > 0) texts.push(t);
        }
        return texts.join('\n');
      });
      
      if (text.length > 50) {
        console.log(`--- 프레임 ${fi} ---`);
        // Find lines with numbers (statistics data)
        const lines = text.split('\n').filter(l => l.trim().length > 0);
        const dataLines = lines.filter(l => /[\d]/.test(l) && l.length < 50);
        if (dataLines.length > 0) {
          dataLines.forEach(l => console.log(`  ${l}`));
        }
        console.log('');
      }
    } catch(e) {
      // cross-origin
    }
  }

  console.log('=== 완료 ===');
})();
