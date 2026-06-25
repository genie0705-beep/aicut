const { chromium } = require('playwright');
const path = require('path');
const IMG_DIR = path.join(__dirname, 'blog_images');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = await context.newPage();
  await page.setViewportSize({ width: 860, height: 900 });

  await page.goto('https://blog.naver.com/aicut/224291552475', { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(4000);

  // 이미지가 화면에 들어올 때까지 스크롤
  await page.mouse.wheel(0, 450);
  await sleep(1200);
  await page.screenshot({ path: path.join(IMG_DIR, 'ref_img_s1.png') });

  await page.mouse.wheel(0, 400);
  await sleep(1200);
  await page.screenshot({ path: path.join(IMG_DIR, 'ref_img_s2.png') });

  await page.mouse.wheel(0, 400);
  await sleep(1200);
  await page.screenshot({ path: path.join(IMG_DIR, 'ref_img_s3.png') });

  await page.mouse.wheel(0, 500);
  await sleep(1200);
  await page.screenshot({ path: path.join(IMG_DIR, 'ref_img_s4.png') });

  await page.mouse.wheel(0, 500);
  await sleep(1200);
  await page.screenshot({ path: path.join(IMG_DIR, 'ref_img_s5.png') });

  await page.close();
  await browser.close();
  console.log('done');
})().catch(e => console.error(e.message));
