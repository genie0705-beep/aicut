const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fs = require('fs');
const path = require('path');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  // 장맛비 탭 찾기 (가장 최근 탭 - 끝에서부터 검색)
  let rainyTab = null;
  for (const p of ctx.pages()) {
    const f = p.frames().find(ff => ff.url().includes('PostWriteForm'));
    if (!f) continue;
    // 본문이 "주말 장맛비"로 시작하는지 확인
    const firstLine = await f.evaluate(() => {
      const data = SmartEditor._editors.blogpc001._documentService.getDocumentData();
      const comps = data?.document?.components || [];
      for (const c of comps) {
        if (c['@ctype'] === 'text' && c.value) {
          for (const v of c.value) {
            if (v.nodes?.[0]?.value?.includes('장맛비')) return true;
          }
        }
      }
      return false;
    });
    if (firstLine) { rainyTab = p; break; }
  }

  if (!rainyTab) { console.log('장맛비 탭 없음'); b.close(); return; }

  await rainyTab.bringToFront();
  await sleep(2000);
  const f = rainyTab.frames().find(ff => ff.url().includes('PostWriteForm'));
  if (!f) { console.log('iframe 없음'); b.close(); return; }

  // 2~6번 이미지 업로드
  console.log('=== 🌧 장맛비 이미지 추가 업로드 ===\n');
  for (let i = 1; i < 6; i++) {
    const num = String(i + 1).padStart(2, '0');
    const imgFile = `aicut_blog_rainy_${num}.png`;
    const imgPath = path.join(__dirname, imgFile);
    if (!fs.existsSync(imgPath)) { console.log(`  ❌ ${imgFile} 없음`); continue; }

    try {
      const [fc] = await Promise.all([
        rainyTab.waitForEvent('filechooser', { timeout: 10000 }).catch(() => null),
        f.evaluate(() => {
          const btns = document.querySelectorAll('button');
          for (const b of btns) if (b.className.includes('se-image-toolbar-button')) { b.click(); return; }
        })
      ]);
      if (fc) { await fc.setFiles(imgPath); console.log(`  ✅ ${imgFile}`); await sleep(5000); }
      else { console.log(`  ⚠️ ${imgFile} 실패`); }
    } catch(e) {
      console.log(`  ⚠️ ${imgFile} 오류: ${e.message.substring(0, 40)}`);
    }
  }

  // 저장
  await f.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const b of btns) if (b.textContent.trim() === '저장') { b.click(); return; }
  });
  await sleep(3000);

  console.log('\n✅ 저장 완료');
  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));
