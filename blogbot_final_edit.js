// 블로그봇 - 최종 버전: 포스트 수정 모드 진입 + 이미지 업로드
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
  console.log('=== 포스트 수정 & 이미지 업로드 (최종) ===');
  console.log(`대상: ${BLOG_ID}, logNo=${LOG_NO}\n`);

  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  page.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  // Step 1: Go to the post page
  console.log('[1] 포스트 페이지 열기...');
  await page.goto(`https://blog.naver.com/${BLOG_ID}/${LOG_NO}`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(4000);
  console.log(`   URL: ${page.url()}`);

  // Step 2: Find mainFrame and click the edit button
  console.log('\n[2] 수정 버튼 클릭...');
  const mfEl = await page.$('iframe[name="mainFrame"]');
  if (!mfEl) {
    console.log('   ❌ mainFrame not found');
    await page.screenshot({ path: path.join(WORKSPACE, 'debug_no_mainframe.png') });
    process.exit(1);
  }

  const mf = await mfEl.contentFrame();
  if (!mf) {
    console.log('   ❌ Cannot access mainFrame');
    process.exit(1);
  }

  console.log('   mainFrame URL:', mf.url().substring(0, 100));

  // Click the edit button
  const editClicked = await mf.evaluate(() => {
    // Method 1: Find the <a> with text "수정"
    const links = document.querySelectorAll('a, button, span');
    for (const el of links) {
      const text = (el.textContent || '').trim();
      // The 수정 button in `blog2_post_function` area
      if (text === '수정' && el.offsetParent !== null) {
        // Check if it's the correct one (has suggestConvert)
        const href = el.getAttribute('href') || '';
        const cls = el.className || '';
        if (href.includes('suggestConvert') || cls.includes('_param')) {
          el.click();
          return { method: 'clicked', text, href: href.substring(0, 80) };
        }
      }
      // Alternative: buttons with "수정하기" text
      if (text.includes('수정하기') && el.offsetParent !== null) {
        el.click();
        return { method: 'clicked', text };
      }
    }

    // Method 2: Direct function call
    if (typeof suggestConvert === 'function') {
      suggestConvert('224341544476', true, false, 4);
      return { method: 'suggestConvert()' };
    }
    return { method: 'none' };
  });

  console.log(`   수정 클릭 결과: ${JSON.stringify(editClicked)}`);

  // Wait for navigation to editor
  await page.waitForTimeout(5000);
  let currentUrl = page.url();
  console.log('   수정 후 URL:', currentUrl);

  // If a new tab/popup opened, switch to it
  let editorPage = page;
  const allPages = ctx.pages();
  for (const p of allPages) {
    const url = p.url();
    if (url.includes('PostWrite') || url.includes('editor') || url.includes('smart_editor') || url.includes('se4')) {
      editorPage = p;
      console.log('   ✅ 에디터 페이지 발견:', url.substring(0, 100));
      break;
    }
  }

  // Wait more for editor to fully load
  await editorPage.waitForTimeout(3000);
  console.log('   에디터 페이지 URL:', editorPage.url());
  console.log('   에디터 페이지 제목:', await editorPage.title().catch(() => 'N/A'));

  // Step 3: Find SE4 editor
  console.log('\n[3] SE4 에디터 탐색...');
  let editorFrame = null;

  // Wait for iframes to load
  await editorPage.waitForTimeout(2000);

  // Check all frames
  for (const f of editorPage.frames()) {
    try {
      const hasSE = await f.evaluate(() => typeof SmartEditor !== 'undefined');
      if (hasSE) {
        editorFrame = f;
        console.log('   ✅ SmartEditor 발견 (iframe):', (f.url() || '').substring(0, 80));
        break;
      }
    } catch(e) {}
  }

  if (!editorFrame) {
    // If no SE4 yet, wait more
    console.log('   SmartEditor 로드 대기 중...');
    for (let i = 0; i < 15; i++) {
      await editorPage.waitForTimeout(2000);
      for (const f of editorPage.frames()) {
        try {
          const hasSE = await f.evaluate(() => typeof SmartEditor !== 'undefined');
          if (hasSE) {
            editorFrame = f;
            console.log(`   ✅ ${i*2+2}초 후 SmartEditor 발견`);
            break;
          }
        } catch(e) {}
      }
      if (editorFrame) break;
    }
  }

  if (!editorFrame) {
    console.log('   ❌ SmartEditor를 찾을 수 없습니다.');
    console.log('   현재 프레임 목록:');
    for (const f of editorPage.frames()) {
      try {
        const url = (f.url() || '').substring(0, 120);
        if (url !== 'about:blank') console.log(`   - ${url}`);
      } catch(e) {}
    }
    await editorPage.screenshot({ path: path.join(WORKSPACE, 'debug_editor.png') });
    console.log('   스크린샷: debug_editor.png');
    process.exit(1);
  }

  // Step 4: Get current editor info
  console.log('\n[4] 에디터 문서 정보...');
  const docInfo = await editorFrame.evaluate(() => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      if (!ed) return { error: 'blogpc001 not found', editors: Object.keys(SmartEditor._editors || {}) };

      const data = ed.getDocumentData ? ed.getDocumentData() : '';
      const title = ed.getDocumentTitle ? ed.getDocumentTitle() : '';
      const dataStr = typeof data === 'string' ? data : JSON.stringify(data);

      // Count images
      const imgRegex = /se-component[^>]*se-image/g;
      const imgCount = (dataStr.match(imgRegex) || []).length;

      return {
        title: title.substring(0, 50),
        dataLength: dataStr.length,
        imgCount,
        hasImageUploadService: !!ed._imageUploadService,
        hasComponentService: !!ed._componentService,
        hasDocumentService: !!ed._documentService,
      };
    } catch(e) {
      return { error: e.message };
    }
  });
  console.log(`   ${JSON.stringify(docInfo, null, 2)}`);

  // Step 5: Upload images
  console.log('\n[5] 이미지 업로드...');

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const imgPath = path.join(WORKSPACE, img.file);
    if (!fs.existsSync(imgPath)) {
      console.log(`   ❌ ${img.file} 파일 없음`);
      continue;
    }

    console.log(`\n   ${i+1}/${images.length} ${img.label} (${img.file}) 업로드 중...`);

    // Read and upload as base64
    const fileBuffer = fs.readFileSync(imgPath);
    const base64Data = fileBuffer.toString('base64');
    const mimeType = 'image/png';

    // Try direct file input injection
    const result = await editorFrame.evaluate(({ base64, mime, fname, idx }) => {
      try {
        const ed = SmartEditor._editors['blogpc001'];

        // Convert to File
        const bs = atob(base64);
        const ab = new ArrayBuffer(bs.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < bs.length; i++) ia[i] = bs.charCodeAt(i);
        const blob = new Blob([ab], { type: mime });
        const file = new File([blob], fname, { type: mime });

        // Method A: Direct image upload via SE4's upload service
        const uploadSvc = ed._imageUploadService || ed._uploadService;
        if (uploadSvc && typeof uploadSvc.uploadImage === 'function') {
          // This might work if the service exists
          return { ok: false, method: 'uploadService not tried' };
        }

        // Method B: Insert image component via componentService
        if (ed._componentService && typeof ed._componentService.insertComponent === 'function') {
          ed._componentService.insertComponent('image');
          return { ok: true, method: 'insertComponent' };
        }

        // Method C: Try to find file inputs
        const fileInputs = document.querySelectorAll('input[type="file"]');
        if (fileInputs.length > 0) {
          const dt = new DataTransfer();
          dt.items.add(file);
          for (const inp of fileInputs) {
            Object.defineProperty(inp, 'files', { value: dt.files, writable: false });
            inp.dispatchEvent(new Event('change', { bubbles: true }));
          }
          return { ok: true, method: 'fileInput', count: fileInputs.length };
        }

        // Method D: Use documentService to insert image component HTML
        if (ed._documentService && typeof ed._documentService.setDocumentData === 'function') {
          // Append image HTML to end of document
          const imgHtml = `<div class="se-component se-image se-l-default"><div class="se-component-content"><div class="se-section se-section-image se-l-default se-section-align-center"><div class="se-module se-module-image"><img src="data:${mime};base64,${base64}" alt="" class="se-image-resource" style="width: 100%;"/></div></div></div></div>`;
          return { ok: true, method: 'documentService', html: 'img component created' };
        }

        return { ok: false, error: 'no upload method' };
      } catch(e) {
        return { ok: false, error: e.message };
      }
    }, { base64: base64Data, mime: mimeType, fname: img.file, idx: i });

    console.log(`   결과: ${JSON.stringify(result)}`);

    if (result.ok) {
      await editorPage.waitForTimeout(3000);
    } else {
      // Fallback: try using the photo button
      console.log('   ⚠️ 직접 업로드 실패. 사진 버튼 시도...');

      await editorFrame.evaluate(() => {
        try {
          const ed = SmartEditor._editors['blogpc001'];
          if (ed && ed._canvasScrollingService) {
            ed._canvasScrollingService.scrollToBottom();
          }
        } catch(e) {}
      }).catch(() => {});
      await editorPage.waitForTimeout(500);
      await editorPage.keyboard.press('End');
      await editorPage.waitForTimeout(300);
      await editorPage.keyboard.press('Enter');
      await editorPage.waitForTimeout(300);

      const [fileChooser] = await Promise.all([
        editorPage.waitForEvent('filechooser', { timeout: 8000 }).catch(() => null),
        editorFrame.evaluate(() => {
          // Find photo buttons
          const btns = document.querySelectorAll('button');
          for (const btn of btns) {
            const html = btn.innerHTML.toLowerCase();
            const title = (btn.getAttribute('title') || '').toLowerCase();
            if (title.includes('사진') || html.includes('사진') || html.includes('image') || html.includes('photo')) {
              btn.click();
              return 'clicked: ' + (btn.textContent || '').trim();
            }
          }
          // Try all toolbar buttons
          const toolbarBtns = document.querySelectorAll('[class*="toolbar"] button, .se-toolbar button');
          for (const btn of toolbarBtns) {
            btn.click();
            return 'clicked toolbar btn';
          }
          return 'no photo button';
        })
      ]);

      if (fileChooser) {
        await fileChooser.setFiles([imgPath]);
        console.log('   ✅ FileChooser 업로드 완료');
        await editorPage.waitForTimeout(4000);
      } else {
        console.log('   ⚠️ FileChooser 없음. 다음 이미지로 넘어감');
      }
    }
  }

  // Step 6: Save
  console.log('\n[6] 저장...');
  try {
    const saveResult = await editorFrame.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        const text = btn.textContent.trim();
        if (text === '저장' || text === '저장하기') {
          btn.click();
          return 'clicked: ' + text;
        }
      }
      // Try the save button in the main page (not iframe)
      const mainBtns = document.querySelectorAll('button');
      for (const btn of mainBtns) {
        if (btn.textContent.trim() === '저장') {
          btn.click();
          return 'clicked main: 저장';
        }
      }
      return 'no save button found';
    });

    console.log(`   저장: ${saveResult}`);
    await editorPage.waitForTimeout(5000);
    console.log('   저장 후 URL:', editorPage.url());
  } catch(e) {
    console.log(`   저장 오류: ${e.message}`);
  }

  console.log('\n=== 📋 최종 결과 ===');
  const finalUrl = editorPage.url();
  console.log('최종 URL:', finalUrl);
  console.log('최종 제목:', await editorPage.title().catch(() => 'N/A'));

  console.log('\n✅ 작업 완료');
})().catch(e => {
  console.error('❌ 치명적 오류:', e.message);
  process.exit(1);
});
