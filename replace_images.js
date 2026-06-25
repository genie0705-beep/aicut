const { chromium } = require('playwright');
const path = require('path');
const IMG_DIR = path.join(__dirname, 'blog_images');

const NEW_IMAGES = [
  path.join(IMG_DIR, '01_summary.png'),
  path.join(IMG_DIR, '02_problem.png'),
  path.join(IMG_DIR, '03_reason.png'),
  path.join(IMG_DIR, '04_result.png'),
  path.join(IMG_DIR, '05_cta.png'),
];

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const pages = context.pages();
  const editorPage = pages.find(p => p.url().includes('Redirect=Write'));
  const mainFrame = editorPage.frame({ name: 'mainFrame' });

  // 기존 이미지 목록 확인
  const imgInfo = await mainFrame.evaluate(() => {
    return Array.from(document.querySelectorAll('img.se-image-resource')).map((img, i) => ({
      idx: i,
      src: img.src.substring(0, 60),
      rect: { x: Math.round(img.getBoundingClientRect().x), y: Math.round(img.getBoundingClientRect().y) }
    }));
  });
  console.log('[INFO] Current images:', JSON.stringify(imgInfo, null, 2));

  for (let i = 0; i < NEW_IMAGES.length; i++) {
    console.log(`\n[STEP ${i+1}] Replacing image ${i+1}...`);

    // 이미지 클릭 → 선택 → 삭제 → 새 이미지 삽입
    const imgData = await mainFrame.evaluate((idx) => {
      const imgs = document.querySelectorAll('img.se-image-resource');
      if (!imgs[idx]) return null;
      imgs[idx].click();
      const r = imgs[idx].getBoundingClientRect();
      return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
    }, i);

    if (!imgData) { console.log('[WARN] Image not found'); continue; }

    // 이미지 클릭 (선택)
    await editorPage.mouse.click(imgData.x, imgData.y);
    await sleep(600);

    // Delete 키로 삭제
    await editorPage.keyboard.press('Delete');
    await sleep(400);

    // 사진 버튼 클릭 + 파일 선택
    try {
      const [fc] = await Promise.all([
        editorPage.waitForEvent('filechooser', { timeout: 8000 }),
        mainFrame.evaluate(() => {
          const btn = document.querySelector('.se-image-toolbar-button');
          if (btn) { btn.click(); return true; }
          return false;
        })
      ]);
      await fc.setFiles(NEW_IMAGES[i]);
      console.log(`[OK] Image ${i+1} replaced`);
      await sleep(4000);
    } catch(e) {
      console.log(`[WARN] ${i+1}:`, e.message.substring(0, 50));
    }
  }

  // 임시저장
  await mainFrame.evaluate(() => {
    const btn = document.querySelector('.save_btn__bzc5B');
    if (btn) btn.click();
  });
  await sleep(2000);
  await editorPage.screenshot({ path: path.join(IMG_DIR, 'final_replaced.png') });
  console.log('\n[DONE] All images replaced and saved');
  await browser.close();
})().catch(e => console.error('[ERROR]', e.message));
