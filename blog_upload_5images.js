const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const IMG_FILES = [
  'aicut_blog_5q_thumb.png',
  'aicut_blog_5q_q1.png',
  'aicut_blog_5q_q2.png',
  'aicut_blog_5q_q3.png',
  'aicut_blog_5q_q4.png'
];

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  let target = null;
  for (const p of pages) {
    if (p.url().includes('PostWriteForm')) { target = p; break; }
  }
  if (!target) { console.log('NO_TAB'); b.close(); return; }

  target.on('dialog', async d => { console.log('DIALOG:', d.message().substring(0, 80)); await d.dismiss(); });
  await target.bringToFront();
  await sleep(2000);

  // Check current state
  const before = await target.evaluate(() => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      const imgs = document.querySelector('.se-component-content')?.querySelectorAll('img')?.length || 0;
      return { len: ed.getContentText().length, imgs: imgs };
    } catch(e) { return { err: e.message }; }
  });
  console.log('BEFORE:', JSON.stringify(before));

  // Build full paths to existing images
  const imgPaths = IMG_FILES.map(f => {
    const fullPath = path.join(__dirname, f);
    return { name: f, exists: fs.existsSync(fullPath), path: fullPath };
  });
  const validPaths = imgPaths.filter(i => i.exists).map(i => i.path);
  console.log('Valid images:', validPaths.length, '/', IMG_FILES.length);
  if (validPaths.length === 0) {
    console.log('No images found!');
    b.close();
    return;
  }

  // Method: Try clicking insert menu + image button to open file chooser
  // First click the "+" floating button to open insert menu
  const plusBtn = await target.locator('.se-insert-menu-button-image, button.se-document-toolbar-basic-image');
  const btnCount = await plusBtn.count();
  console.log('Image insert buttons found:', btnCount);

  if (btnCount > 0) {
    // Click the image insert button and wait for file chooser
    const [fileChooser] = await Promise.all([
      target.waitForEvent('filechooser', { timeout: 10000 }).catch(() => null),
      plusBtn.first().click()
    ]);

    if (fileChooser) {
      console.log('File chooser opened!');
      await fileChooser.setFiles(validPaths);
      console.log('Files set:', validPaths.length);
      await sleep(8000); // Wait for uploads
    } else {
      console.log('No file chooser - trying toolbar button');
      
      // Try the toolbar "사진" button instead
      const imgBtn = target.locator('button.se-image-toolbar-button');
      const [fc2] = await Promise.all([
        target.waitForEvent('filechooser', { timeout: 10000 }).catch(() => null),
        imgBtn.click()
      ]);
      
      if (fc2) {
        console.log('Toolbar file chooser opened!');
        await fc2.setFiles(validPaths);
        console.log('Files set:', validPaths.length);
        await sleep(8000);
      } else {
        // Try clicking "내 PC" in the popup
        console.log('Trying to find "내 PC" option...');
        await sleep(2000);
        
        const pcBtn = await target.locator('button:has-text("내 PC"), li:has-text("내 PC"), div:has-text("내 PC")');
        const pcCount = await pcBtn.count();
        if (pcCount > 0) {
          const [fc3] = await Promise.all([
            target.waitForEvent('filechooser', { timeout: 10000 }).catch(() => null),
            pcBtn.first().click()
          ]);
          if (fc3) {
            console.log('PC upload file chooser opened!');
            await fc3.setFiles(validPaths);
            console.log('Files set:', validPaths.length);
            await sleep(8000);
          }
        } else {
          console.log('No "내 PC" button found');
        }
      }
    }
  }

  // Check images after upload
  const after = await target.evaluate(() => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      const imgs = document.querySelector('.se-component-content')?.querySelectorAll('img')?.length || 0;
      return { len: ed.getContentText().length, imgs: imgs };
    } catch(e) { return { err: e.message }; }
  });
  console.log('AFTER:', JSON.stringify(after));

  // Save
  console.log('Saving...');
  let saved = false;
  for (let i = 0; i < 8; i++) {
    saved = await target.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        if ((btn.innerText || '').trim() === '저장' && btn.offsetParent !== null) {
          btn.click(); return true;
        }
      }
      return false;
    });
    if (saved) { console.log('SAVED'); break; }
    await sleep(1000);
  }
  await sleep(3000);

  console.log('DONE');
  b.close();
})();
