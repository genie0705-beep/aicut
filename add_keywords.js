const { chromium } = require('playwright');
const path = require('path');
const IMG_DIR = path.join(__dirname, 'blog_images');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const pages = context.pages();
  const adPage = pages.find(p => p.url().includes('ads.naver.com'));
  await adPage.setViewportSize({ width: 1400, height: 900 });

  // "저장하고 계속하기" 버튼 클릭
  const saveBtn = await adPage.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.trim().includes('저장하고 계속하기'));
    if (btn) { const r = btn.getBoundingClientRect(); return { x: Math.round(r.x+r.width/2), y: Math.round(r.y+r.height/2), text: btn.textContent.trim() }; }
    return null;
  });
  console.log('[SAVE BTN]', saveBtn);

  if (saveBtn) {
    await adPage.mouse.click(saveBtn.x, saveBtn.y);
    await sleep(3000);
    await adPage.screenshot({ path: path.join(IMG_DIR, 'add_kw_result.png') });
    
    const result = await adPage.evaluate(() => document.body.innerText.substring(0, 3000));
    console.log('[RESULT AFTER SAVE]', result.substring(0, 2000));
    console.log('[URL]', adPage.url());
  }

  await browser.close();
})().catch(e => console.error(e.message));
