const { chromium } = require('playwright');
const path = require('path');
const IMG_DIR = path.join(__dirname, 'blog_images');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  const adPage = pages.find(p => p.url().includes('ads.naver.com'));
  await adPage.setViewportSize({ width: 1400, height: 900 });

  // 확인 버튼 클릭 (x=660, y=600)
  await adPage.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const confirmBtn = btns.find(b => b.textContent.trim() === '확인');
    if (confirmBtn) confirmBtn.click();
  });
  await sleep(3000);
  await adPage.screenshot({ path: path.join(IMG_DIR, 'biz_channel_done.png') });
  console.log('[URL]', adPage.url());

  const text = await adPage.evaluate(() => document.body.innerText.substring(0, 3000));
  console.log('[RESULT]', text.substring(0, 2000));

  await browser.close();
})().catch(e => console.error(e.message));
