const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fs = require('fs');
const path = require('path');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  // 모든 dialog 자동 수락
  ctx.on('page', page => {
    page.on('dialog', dialog => {
      console.log(`  ⚠️ dialog: ${dialog.message().substring(0, 40)}`);
      dialog.accept().catch(() => {});
    });
  });

  // 장맛비 tab
  let rainyTab = null;
  for (const p of ctx.pages()) {
    const f = p.frames().find(ff => ff.url().includes('PostWriteForm'));
    if (!f) continue;
    const isRainy = await f.evaluate(() => {
      const data = SmartEditor._editors.blogpc001._documentService.getDocumentData();
      return JSON.stringify(data).includes('주말 장맛비');
    });
    if (isRainy) { rainyTab = p; break; }
  }

  if (!rainyTab) { console.log('장맛비 탭 없음'); b.close(); return; }

  await rainyTab.bringToFront();
  await sleep(2000);
  const f = rainyTab.frames().find(ff => ff.url().includes('PostWriteForm'));

  // 2~6번 이미지 업로드 (하나씩)
  for (let i = 1; i < 6; i++) {
    const num = String(i + 1).padStart(2, '0');
    const imgFile = `aicut_blog_rainy_${num}.png`;
    const imgPath = path.join(__dirname, imgFile);
    if (!fs.existsSync(imgPath)) continue;

    try {
      // 사전에 dialog 핸들러 설정
      const [fc] = await Promise.all([
        rainyTab.waitForEvent('filechooser', { timeout: 15000 }).catch(() => null),
        f.evaluate(() => {
          const btns = document.querySelectorAll('button');
          for (const b of btns) if (b.className.includes('se-image-toolbar-button')) { b.click(); return; }
        })
      ]);
      if (fc) { await fc.setFiles(imgPath); console.log(`  ✅ ${imgFile}`); await sleep(6000); }
      else { console.log(`  ⚠️ ${imgFile} filechooser 없음`); break; }
    } catch(e) {
      console.log(`  ⚠️ ${imgFile} 오류: ${e.message.substring(0, 50)}`);
      break;
    }
  }

  // 저장
  try {
    await f.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) if (b.textContent.trim() === '저장') { b.click(); return; }
    });
    await sleep(3000);
    console.log('  ✅ 저장 완료');
  } catch(e) {
    console.log(`  저장 오류: ${e.message.substring(0, 40)}`);
  }

  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));
