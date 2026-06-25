const { chromium } = require('playwright');
const path = require('path');
const IMG_DIR = path.join(__dirname, 'blog_images');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const pages = context.pages();
  console.log('[INFO] Pages:', pages.map(p => p.url().substring(0,80)));

  let editPage = pages.find(p =>
    (p.url().includes('PostWriteForm') && p.url().includes('224298038959')) ||
    p.url().includes('Redirect=Update')
  );

  if (!editPage) { console.log('[ERROR] No edit page'); await browser.close(); return; }
  console.log('[INFO] Edit page found:', editPage.url().substring(0,80));

  // 에디터 로드 대기
  await sleep(5000);

  const frames = editPage.frames();
  console.log('[INFO] Frames count:', frames.length, frames.slice(0,3).map(f => f.url().substring(0,60)));

  const mainFrame = editPage.frame({ name: 'mainFrame' }) ||
                    frames.find(f => f.url().includes('PostWriteForm') && f.url().includes('postNo'));

  if (!mainFrame) { console.log('[ERROR] No mainFrame'); await browser.close(); return; }

  // 이미지 위치
  const imgPos = await mainFrame.evaluate(() => {
    const imgs = document.querySelectorAll('img.se-image-resource');
    if (!imgs[0]) return null;
    const r = imgs[0].getBoundingClientRect();
    return { x: Math.round(r.x+r.width/2), y: Math.round(r.y+r.height/2), count: imgs.length };
  });
  console.log('[INFO] imgPos:', imgPos);

  if (!imgPos) {
    // 에디터 본문 클릭 후 재시도
    await editPage.mouse.click(600, 400);
    await sleep(500);
    await editPage.keyboard.press('Control+Home');
    await sleep(1500);
    const imgPos2 = await mainFrame.evaluate(() => {
      const imgs = document.querySelectorAll('img.se-image-resource');
      if (!imgs[0]) return null;
      const r = imgs[0].getBoundingClientRect();
      return { x: Math.round(r.x+r.width/2), y: Math.round(r.y+r.height/2), count: imgs.length };
    });
    if (!imgPos2) { console.log('[ERROR] No images'); await browser.close(); return; }
    Object.assign(imgPos || {}, imgPos2);
    console.log('[INFO] imgPos2:', imgPos2);

    // 첫 번째 이미지 교체
    await editPage.mouse.click(imgPos2.x, imgPos2.y);
    await sleep(600);
    await editPage.keyboard.press('Delete');
    await sleep(400);
    const [fc] = await Promise.all([
      editPage.waitForEvent('filechooser', { timeout: 10000 }),
      mainFrame.evaluate(() => { document.querySelector('.se-image-toolbar-button')?.click(); })
    ]);
    await fc.setFiles(path.join(IMG_DIR, '01_summary.png'));
    console.log('[OK] Image uploaded');
    await sleep(5000);
  } else {
    await editPage.mouse.click(imgPos.x, imgPos.y);
    await sleep(600);
    await editPage.keyboard.press('Delete');
    await sleep(400);
    const [fc] = await Promise.all([
      editPage.waitForEvent('filechooser', { timeout: 10000 }),
      mainFrame.evaluate(() => { document.querySelector('.se-image-toolbar-button')?.click(); })
    ]);
    await fc.setFiles(path.join(IMG_DIR, '01_summary.png'));
    console.log('[OK] Image uploaded');
    await sleep(5000);
  }

  // 저장 후 발행
  await mainFrame.evaluate(() => { document.querySelector('.save_btn__bzc5B')?.click(); });
  await sleep(2000);
  await mainFrame.evaluate(() => { document.querySelector('.publish_btn__m9KHH')?.click(); });
  await sleep(3000);

  const vpW = await editPage.evaluate(() => window.innerWidth);
  console.log('[INFO] vpW:', vpW);
  // 발행 패널 ✓ 발행 버튼
  await editPage.mouse.click(Math.round(vpW * 0.72), 418);
  await sleep(4000);
  console.log('[INFO] Final URL:', editPage.url());
  console.log('[DONE]');

  await browser.close();
})().catch(e => console.error(e.message));
