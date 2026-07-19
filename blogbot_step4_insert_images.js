// SE4 에디터 - 이미지 업로드 + 저장
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const WORKSPACE = 'C:\\Users\\paul\\.openclaw\\workspace';
const LOG_NO = '224341544476';

const images = [
  { file: 'aicut_implant_main.png', label: '대표 이미지' },
  { file: 'aicut_implant_card1.png', label: '본문카드1' },
  { file: 'aicut_implant_card2.png', label: '본문카드2' },
  { file: 'aicut_implant_card3.png', label: '본문카드3' },
  { file: 'aicut_implant_cta.png', label: 'CTA 이미지' },
];

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];

  // Find postupdate page
  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('postupdate') && p.url().includes(LOG_NO)) {
      page = p;
      break;
    }
  }

  if (!page) {
    console.log('❌ Editor page not found');
    await b.close();
    return;
  }

  console.log('✅ Editor page found:', page.url().substring(0, 80));
  await page.waitForTimeout(1000);

  // Step 1: Get current document info
  console.log('\n[1] 현재 문서 정보...');
  const docInfo = await page.evaluate(() => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      const data = ed.getDocumentData();
      const title = ed.getDocumentTitle();
      const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
      const imgMatch = dataStr.match(/se-image/g);
      return {
        title: title,
        dataLen: dataStr.length,
        imgCount: imgMatch ? imgMatch.length : 0,
      };
    } catch(e) {
      return { error: e.message };
    }
  });
  console.log(`  ${JSON.stringify(docInfo)}`);
  console.log(`  현재 이미지 수: ${docInfo.imgCount}장`);

  // Step 2: Find all buttons on the page
  console.log('\n[2] 페이지 버튼 현황...');
  const buttons = await page.evaluate(() => {
    const results = [];
    document.querySelectorAll('button').forEach(btn => {
      const text = btn.textContent.trim();
      const rect = btn.getBoundingClientRect();
      if (text && rect.width > 0) {
        results.push({
          text: text.substring(0, 30),
          visible: btn.offsetParent !== null,
          cls: (btn.className || '').substring(0, 40),
          rect: { w: Math.round(rect.width), h: Math.round(rect.height) }
        });
      }
    });
    return results;
  });
  buttons.forEach(b => console.log(`  - "${b.text}" visible:${b.visible} cls:${b.cls}`));

  // Step 3: Try using the photo button to upload images
  console.log('\n[3] 이미지 업로드 (사진 버튼 + filechooser)...');

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const imgPath = path.join(WORKSPACE, img.file);
    if (!fs.existsSync(imgPath)) {
      console.log(`  ❌ ${img.file} 파일 없음`);
      continue;
    }

    console.log(`\n  ${i+1}/${images.length} ${img.label} (${img.file})`);

    // First, scroll to bottom of editor to make room
    await page.evaluate(() => {
      try {
        const ed = SmartEditor._editors['blogpc001'];
        if (ed._canvasScrollingService) {
          ed._canvasScrollingService.scrollToBottom();
        }
      } catch(e) {}
    });
    await page.waitForTimeout(500);

    // Press End + Enter to create new paragraph at the end
    await page.keyboard.press('End');
    await page.waitForTimeout(300);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    // Click "사진" button and wait for filechooser
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 8000 }).catch(() => null),
      page.evaluate(() => {
        const btns = document.querySelectorAll('button');
        for (const btn of btns) {
          const text = btn.textContent.trim();
          if (text.includes('사진') || btn.getAttribute('title')?.includes('사진')) {
            btn.click();
            return 'clicked: ' + text;
          }
        }
        // Try the photo button by finding the SE4 photo toolbar
        const photoTool = document.querySelector('[class*="se-photo-"], [class*="photo-button"], [data-cmd="photo"]');
        if (photoTool) {
          const btn = photoTool.querySelector('button');
          if (btn) { btn.click(); return 'clicked photo-tool btn'; }
        }
        return 'not found';
      })
    ]);

    if (fileChooser) {
      await fileChooser.setFiles([imgPath]);
      console.log(`     ✅ FileChooser 업로드 성공`);
      await page.waitForTimeout(3000);
    } else {
      console.log(`     ⚠️ FileChooser 이벤트 없음. 대체 방법 시도...`);

      // Alternative: use DataTransfer + file input direct approach
      const fileBuffer = fs.readFileSync(imgPath);
      const base64 = fileBuffer.toString('base64');
      const mimeType = 'image/png';

      const result = await page.evaluate(({ base64, mime, fname }) => {
        try {
          const ed = SmartEditor._editors['blogpc001'];
          if (!ed) return 'no editor';

          // Try find file inputs
          const fileInputs = document.querySelectorAll('input[type="file"]');
          for (const inp of fileInputs) {
            const dt = new DataTransfer();
            const bs = atob(base64);
            const ab = new ArrayBuffer(bs.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < bs.length; i++) ia[i] = bs.charCodeAt(i);
            const blob = new Blob([ab], { type: mime });
            const file = new File([blob], fname, { type: mime });
            dt.items.add(file);
            Object.defineProperty(inp, 'files', { value: dt.files, writable: false });
            inp.dispatchEvent(new Event('change', { bubbles: true }));
            return 'fileInput found: ' + inp.className;
          }
          return 'no file input found';
        } catch(e) {
          return 'error: ' + e.message;
        }
      }, { base64, mime: mimeType, fname: img.file });
      console.log(`     결과: ${result}`);
      await page.waitForTimeout(3000);
    }
  }

  // Step 4: Find and click save button
  console.log('\n[4] 저장 버튼 찾기...');
  
  // Wait a moment for images to finish uploading
  await page.waitForTimeout(2000);

  // Find all buttons again after image uploads
  const allBtnsAfter = await page.evaluate(() => {
    const results = [];
    document.querySelectorAll('button').forEach(btn => {
      const text = btn.textContent.trim();
      const rect = btn.getBoundingClientRect();
      if (text && rect.width > 0 && btn.offsetParent !== null) {
        results.push({
          text: text.substring(0, 30),
          w: Math.round(rect.w),
          h: Math.round(rect.h),
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          cls: (btn.className || '').substring(0, 40),
        });
      }
    });
    return results;
  });

  console.log('  현재 버튼들:');
  allBtnsAfter.forEach(b => console.log(`    - "${b.text}" (${b.w}x${b.h} at ${b.x},${b.y})`));

  // Try clicking "저장" or "발행" button
  let saveClicked = false;
  for (const btnInfo of allBtnsAfter) {
    if (btnInfo.text.includes('저장') || btnInfo.text === '발행') {
      console.log(`  "${btnInfo.text}" 버튼 발견, 클릭 시도...`);
      
      // Click using evaluate (more reliable than Playwright click)
      await page.evaluate((text) => {
        const btns = document.querySelectorAll('button');
        for (const btn of btns) {
          if (btn.textContent.trim() === text) {
            btn.click();
            return true;
          }
        }
        return false;
      }, btnInfo.text);
      
      saveClicked = true;
      break;
    }
  }

  if (saveClicked) {
    console.log('  ✅ 저장/발행 버튼 클릭됨');
    await page.waitForTimeout(5000);
    console.log('  저장 후 URL:', page.url());
  } else {
    console.log('  ⚠️ 저장 버튼을 찾을 수 없음');
  }

  console.log('\n=== 📋 결과 ===');
  console.log('최종 URL:', page.url());
  console.log('최종 제목:', await page.title());

  await b.close();
})().catch(e => {
  console.error('❌ 오류:', e.message);
  process.exit(1);
});
