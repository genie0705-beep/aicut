const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fs = require('fs');
const path = require('path');

async function uploadImages(page, frame, imgPrefix, count) {
  for (let i = 0; i < count; i++) {
    const num = String(i + 1).padStart(2, '0');
    const imgFile = `${imgPrefix}_${num}.png`;
    const imgPath = path.join(__dirname, imgFile);
    if (!fs.existsSync(imgPath)) { console.log(`      ❌ ${imgFile} 없음`); continue; }

    // "사진" 툴바 버튼 클릭
    await frame.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        if (b.className.includes('se-image-toolbar-button')) {
          b.click();
          return;
        }
      }
    });
    await sleep(1000);

    // file chooser 대기
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 8000 }).catch(() => null),
      frame.evaluate(() => {
        // "사진 추가" 버튼 클릭으로 file dialog 열기
        const btns = document.querySelectorAll('button');
        for (const b of btns) {
          if (b.className.includes('se-image-toolbar-button')) {
            b.click();
            return;
          }
        }
      })
    ]);

    if (fileChooser) {
      await fileChooser.setFiles(imgPath);
      console.log(`      ✅ ${imgFile} 업로드 중...`);
      await sleep(5000); // 업로드 대기
    } else {
      console.log(`      ⚠️ ${imgFile} - fileChooser 없음`);
    }
  }
}

(async () => {
  console.log('=== 블로그 이미지 업로드 ===\n');

  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  const posts = [
    { imgPrefix: 'aicut_blog_baseball', count: 6, label: '⚾ 프로야구', idx: 0 },
    { imgPrefix: 'aicut_blog_rainy', count: 6, label: '🌧 장맛비', idx: 1 },
  ];

  for (const post of posts) {
    let tabIdx = 0;
    for (const p of ctx.pages()) {
      const f = p.frames().find(ff => ff.url().includes('PostWriteForm'));
      if (!f) continue;
      if (tabIdx !== post.idx) { tabIdx++; continue; }

      await p.bringToFront();
      await sleep(2000);
      console.log(`${post.label} 이미지 업로드...`);
      await uploadImages(p, f, post.imgPrefix, post.count);

      // 저장
      await f.evaluate(() => {
        const btns = document.querySelectorAll('button');
        for (const b of btns) {
          if (b.textContent.trim() === '저장') { b.click(); return; }
        }
      });
      await sleep(3000);
      console.log(`  ✅ 저장 완료\n`);
      tabIdx++;
    }
  }

  console.log('✅ 이미지 업로드 완료');
  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));
