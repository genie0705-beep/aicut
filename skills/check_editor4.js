const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();

  console.log('Navigating to blog...');
  await page.goto('https://blog.naver.com/aicut', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(5000);

  // Get ALL frames including sub-frames
  const allFrames = page.frames();
  console.log(`\n=== All frames (${allFrames.length}):`);
  
  for (let i = 0; i < allFrames.length; i++) {
    const f = allFrames[i];
    try {
      const title = await f.title();
      const text = await f.evaluate(() => document.body.innerText.slice(0, 100)).catch(() => '?');
      const hasSE = await f.evaluate(() => typeof SmartEditor !== 'undefined').catch(() => false);
      const url = f.url();
      console.log(`[${i}] ${url.slice(0, 120)}`);
      console.log(`    title: ${title.slice(0, 60)} | text: ${text.slice(0,60)} | SE: ${hasSE}`);
    } catch(e) {
      console.log(`[${i}] error: ${e.message}`);
    }
  }

  // Check each frame for 글쓰기 button
  for (let i = 0; i < allFrames.length; i++) {
    try {
      const buttons = await allFrames[i].evaluate(() => {
        return Array.from(document.querySelectorAll('a, button, span, div'))
          .filter(el => {
            const t = el.textContent.trim();
            return t.includes('글쓰기') || t.includes('글 쓰') || t.includes('작성');
          })
          .slice(0, 5)
          .map(el => ({ tag: el.tagName, text: el.textContent.trim().slice(0, 30), href: el.href || '', id: el.id }));
      });
      if (buttons.length > 0) {
        console.log(`\n📝 Frame [${i}] has write buttons:`);
        buttons.forEach(b => console.log(`  ${JSON.stringify(b)}`));
      }
    } catch(e) {}
  }

  // Also try the modern post write URL
  console.log('\n\n=== Trying modern post write URL ===');
  await page.goto('https://blog.naver.com/PostWrite.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(3000);
  console.log('URL:', page.url());
  
  const frames2 = page.frames();
  console.log(`Frames: ${frames2.length}`);
  for (let i = 0; i < Math.min(frames2.length, 10); i++) {
    try {
      const url = frames2[i].url();
      const hasSE = await frames2[i].evaluate(() => typeof SmartEditor !== 'undefined').catch(() => false);
      const text = await frames2[i].evaluate(() => document.body.innerText.slice(0, 150)).catch(() => '?');
      console.log(`[${i}] SE:${hasSE} ${url.slice(0,100)} | ${text.slice(0,80)}`);
    } catch(e) {
      console.log(`[${i}] err`);
    }
  }
  
  // Take full page screenshot
  await page.screenshot({ path: path.join(__dirname, '..', '_editor2.png'), fullPage: true });
  console.log('\nScreenshot saved');
})();
