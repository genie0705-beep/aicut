// 블로그봇 - 포스트 수정 & 이미지 업로드
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BLOG_ID = 'aicut';
const LOG_NO = '224341544476';
const WORKSPACE = 'C:\\Users\\paul\\.openclaw\\workspace';

const images = [
  { file: 'aicut_implant_main.png', label: '대표 이미지' },
  { file: 'aicut_implant_card1.png', label: '본문카드1' },
  { file: 'aicut_implant_card2.png', label: '본문카드2' },
  { file: 'aicut_implant_card3.png', label: '본문카드3' },
  { file: 'aicut_implant_cta.png', label: 'CTA 이미지' },
];

(async () => {
  console.log('=== 포스트 수정 & 이미지 업로드 시작 ===');
  console.log(`대상: blogId=${BLOG_ID}, logNo=${LOG_NO}`);

  // Connect to running Chrome
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];

  // Open in edit mode - try multiple URL patterns
  const page = await ctx.newPage();
  page.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  // Try direct SE4 write URL first (most reliable for existing post editing)
  const editUrl = `https://blog.naver.com/PostWrite.naver?blogId=${BLOG_ID}&logNo=${LOG_NO}&redirect=Edit`;
  console.log(`\n[1] 수정 모드 열기: ${editUrl}`);
  await page.goto(editUrl, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(4000);

  let currentUrl = page.url();
  console.log('현재 URL:', currentUrl);
  console.log('현재 제목:', await page.title());

  // Check if redirected
  if (currentUrl.includes('PostView') && !currentUrl.includes('Redirect=Update')) {
    console.log('-> PostView로 리디렉션됨. 수정 버튼 찾기 시도...');

    // Try to find and click the edit button
    const editClicked = await page.evaluate(() => {
      // Method 1: Link with Edit in href
      const links = document.querySelectorAll('a');
      for (const link of links) {
        const href = link.getAttribute('href') || '';
        const text = (link.textContent || '').trim();
        if ((href.includes('Edit') || href.includes('edit')) && (text === '수정' || text.includes('수정'))) {
          console.log('Click edit link:', href, text);
          link.click();
          return 'clicked link: ' + text;
        }
      }
      // Method 2: Any element with text "수정"
      const els = document.querySelectorAll('a, button, span, div');
      for (const el of els) {
        if (el.textContent.trim() === '수정') {
          el.click();
          return 'clicked element: ' + el.tagName;
        }
      }
      // Method 3: Try more patterns
      for (const el of els) {
        const txt = el.textContent.trim();
        if ((txt === '수정' || txt === '편집' || txt === '글 수정') && el.offsetParent !== null) {
          el.click();
          return 'clicked: ' + txt;
        }
      }
      return 'not found';
    });
    console.log('수정 버튼 시도:', editClicked);
    await page.waitForTimeout(5000);
    currentUrl = page.url();
    console.log('수정 후 URL:', currentUrl);
  }

  // Find editor frame
  console.log('\n[2] SE4 에디터 탐색...');
  let editorFrame = null;

  // First try: look for SmartEditor in any frame
  for (const f of page.frames()) {
    try {
      const hasSE = await f.evaluate(() => typeof SmartEditor !== 'undefined');
      if (hasSE) {
        editorFrame = f;
        console.log('✅ SmartEditor 발견:', (f.url() || '').substring(0, 80));
        break;
      }
    } catch(e) {}
  }

  // Second try: look for PostWriteForm or PostUpdateForm frame
  if (!editorFrame) {
    for (const f of page.frames()) {
      const url = f.url();
      if (url.includes('PostWriteForm') || url.includes('PostUpdateForm') || url.includes('se_editor_iframe')) {
        try {
          const hasSE = await f.evaluate(() => typeof SmartEditor !== 'undefined');
          if (hasSE) {
            editorFrame = f;
            console.log('✅ PostUpdateForm 에서 SmartEditor 발견');
            break;
          }
        } catch(e) {}
      }
    }
  }

  // Third try: check main page
  if (!editorFrame) {
    const mainSE = await page.evaluate(() => typeof SmartEditor !== 'undefined');
    if (mainSE) {
      editorFrame = page;
      console.log('✅ 메인 페이지에 SmartEditor 존재');
    }
  }

  if (!editorFrame) {
    console.log('❌ SmartEditor를 찾을 수 없습니다.');
    console.log('사용 가능한 프레임:');
    for (const f of page.frames()) {
      try {
        console.log(`  - ${(f.url() || 'about:blank').substring(0, 100)}`);
      } catch(e) {}
    }
    await page.screenshot({ path: path.join(WORKSPACE, 'debug_edit_page.png'), fullPage: false });
    console.log('스크린샷: debug_edit_page.png');
    await page.close();
    b.disconnect();
    process.exit(1);
  }

  // Read image files as base64 for inline upload
  console.log('\n[3] 이미지 업로드...');
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const imgPath = path.join(WORKSPACE, img.file);

    if (!fs.existsSync(imgPath)) {
      console.log(`  ❌ 파일 없음: ${imgPath}`);
      continue;
    }

    console.log(`\n  ${i+1}/${images.length} ${img.label} (${img.file}) 업로드 중...`);

    try {
      // Read file as base64
      const fileBuffer = fs.readFileSync(imgPath);
      const base64Data = fileBuffer.toString('base64');
      const mimeType = 'image/png';

      // Method A: Direct file input injection (SE4 API)
      const result = await editorFrame.evaluate(({ base64, mime, fname }) => {
        try {
          const ed = SmartEditor._editors['blogpc001'];
          if (!ed) return { ok: false, error: 'blogpc001 not found' };

          // Convert base64 to file
          const byteString = atob(base64);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([ab], { type: mime });
          const file = new File([blob], fname, { type: mime });

          // Use SE4's image upload service if available
          const svc = ed._imageUploadService || ed._uploadService;
          if (svc && typeof svc.uploadImage === 'function') {
            svc.uploadImage(file).then(url => {
              console.log('Upload success:', url);
            });
            return { ok: true, method: 'uploadService' };
          }

          // Alternative: find file input and simulate
          const fileInputs = document.querySelectorAll('input[type="file"]');
          for (const inp of fileInputs) {
            const dt = new DataTransfer();
            dt.items.add(file);
            Object.defineProperty(inp, 'files', { value: dt.files, writable: false });
            inp.dispatchEvent(new Event('change', { bubbles: true }));
            return { ok: true, method: 'fileInput', inputs: fileInputs.length };
          }

          // Try to insert via component service
          if (ed._componentService && ed._componentService.insertComponent) {
            ed._componentService.insertComponent('image');
            return { ok: true, method: 'insertComponent' };
          }

          return { ok: false, error: 'no upload method available' };
        } catch(e) {
          return { ok: false, error: e.message, stack: e.stack?.substring(0, 200) };
        }
      }, { base64: base64Data, mime: mimeType, fname: img.file });

      console.log(`   결과: ${JSON.stringify(result)}`);

      if (result.ok && result.method === 'insertComponent') {
        // If we inserted an image component, now we need to upload via filechooser
        await page.waitForTimeout(2000);

        const [fileChooser] = await Promise.all([
          page.waitForEvent('filechooser', { timeout: 8000 }).catch(() => null),
          new Promise(resolve => setTimeout(resolve, 100))
        ]);

        if (fileChooser) {
          await fileChooser.setFiles([imgPath]);
          console.log(`   ✅ FileChooser로 업로드 완료`);
          await page.waitForTimeout(4000);
        } else {
          console.log(`   ⚠️ FileChooser 이벤트 없음`);
        }
      } else if (result.ok) {
        await page.waitForTimeout(4000);
        console.log(`   ✅ 업로드 완료 (${result.method})`);
      }

    } catch(e) {
      console.error(`   ❌ 업로드 실패: ${e.message}`);
    }
  }

  // Step 4: Save
  console.log('\n[4] 저장...');
  try {
    const saveResult = await editorFrame.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        if (btn.textContent.trim() === '저장') {
          btn.click();
          return 'clicked: 저장';
        }
      }
      // Try more selectors
      const allBtns = document.querySelectorAll('button, a, [role="button"]');
      for (const btn of allBtns) {
        const text = btn.textContent.trim();
        if (text.includes('저장') || text === '저장하기') {
          btn.click();
          return 'clicked: ' + text;
        }
      }
      return 'no save button found';
    });
    console.log('저장 버튼:', saveResult);
    await page.waitForTimeout(5000);
    console.log('저장 후 URL:', page.url());
  } catch(e) {
    console.error('저장 실패:', e.message);
  }

  console.log('\n=== 작업 완료 ===');
  console.log('최종 URL:', page.url());

  await page.close();
  b.disconnect();
})().catch(e => {
  console.error('❌ 오류:', e.message);
  console.error(e.stack?.substring(0, 500));
  process.exit(1);
});
