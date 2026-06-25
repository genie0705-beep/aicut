const { chromium } = require('playwright');
const path = require('path');
const IMG_DIR = path.join(__dirname, 'blog_images');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = await context.newPage();
  await page.setViewportSize({ width: 1200, height: 900 });

  await page.goto('https://blog.naver.com/aicut/224291552475', { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(3000);

  // 스크롤하며 각 섹션 캡처
  for (let i = 0; i < 6; i++) {
    await page.screenshot({ path: path.join(IMG_DIR, `ref_scroll_${i}.png`) });
    await page.mouse.wheel(0, 700);
    await sleep(1500);
  }
  console.log('[INFO] All screenshots saved');
  await page.close();
  await browser.close();
})().catch(e => console.error(e.message));
