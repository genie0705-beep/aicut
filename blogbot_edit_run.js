// 블로그봇 - SE4 에디터로 기존 포스트 수정 (이미지 업로드)
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BLOG_ID = 'aicut';
const LOG_NO = '224341544476';
const WORKSPACE = 'C:\\Users\\paul\\.openclaw\\workspace';

const images = [
  { file: 'aicut_implant_main.png', label: '대표 이미지', width: 700, height: 700 },
  { file: 'aicut_implant_card1.png', label: '본문카드1', width: 600, height: 338 },
  { file: 'aicut_implant_card2.png', label: '본문카드2', width: 600, height: 338 },
  { file: 'aicut_implant_card3.png', label: '본문카드3', width: 600, height: 338 },
  { file: 'aicut_implant_cta.png', label: 'CTA 이미지', width: 500, height: 300 },
];

(async () => {
  console.log('=== 포스트 수정 & 이미지 업로드 ===');
  console.log(`대상: blogId=${BLOG_ID}, logNo=${LOG_NO}\n`);

  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  page.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  // Step 1: Open edit mode - try URL pattern from fix_post.js
  console.log('[1] 수정 모드 열기...');
  const editUrl = `https://blog.naver.com/${BLOG_ID}/${LOG_NO}?Redirect=Write&`;
  console.log(`   URL: ${editUrl}`);
  await page.goto(editUrl, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(4000);
  console.log(`   현재 URL: ${page.url()}`);

  // If redirected to PostView, try clicking edit button
  let currentUrl = page.url();
  if (currentUrl.includes('PostView') && !currentUrl.includes('Redirect=Write')) {
    console.log('   PostView로 리디렉션됨. 수정 버튼 탐색...');

    // Try the direct edit URL pattern
    const editUrl2 = `https://blog.naver.com/PostView.naver?blogId=${BLOG_ID}&Redirect=Edit&logNo=${LOG_NO}`;
    console.log(`   시도: ${editUrl2}`);
    await page.goto(editUrl2, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(4000);
    console.log(`   현재 URL: ${page.url()}`);

    if (page.url().includes('PostView') && !page.url().includes('Redirect')) {
      console.log('   수정 버튼 직접 클릭 시도...');
      const editBtnResult = await page.evaluate(() => {
        // Method: Find the 수정 button
        const allEls = document.querySelectorAll('a, button, span, div');
        for (const el of allEls) {
          const text = el.textContent.trim();
          if (text === '수정' && el.offsetParent !== null) {
            el.click();
            return { clicked: true, text, tag: el.tagName };
          }
        }
        // Method 2: href contains Edit
        const links = document.querySelectorAll('a[href*="Edit"]');
        for (const link of links) {
          if (link.offsetParent !== null) {
            link.click();
            return { clicked: true, href: link.href };
          }
        }
        return { clicked: false };
      });
      console.log(`   수정 버튼: ${JSON.stringify(editBtnResult)}`);
      await page.waitForTimeout(5000);
      console.log(`   수정 후 URL: ${page.url()}`);
    }
  }

  // Step 2: Find SE4 editor frame
  console.log('\n[2] SE4 에디터 탐색...');
  
  // Wait a bit more for editor to load
  await page.waitForTimeout(2000);

  let editorFrame = null;

  // Method 1: Look for SmartEditor in main frame
  const mainHasSE = await page.evaluate(() => typeof SmartEditor !== 'undefined').catch(() => false);
  if (mainHasSE) {
    console.log('   ✅ 메인 페이지에 SmartEditor 존재');
    editorFrame = page;
  }

  // Method 2: Check all frames
  if (!editorFrame) {
    for (const f of page.frames()) {
      try {
        const hasSE = await f.evaluate(() => typeof SmartEditor !== 'undefined');
        if (hasSE) {
          editorFrame = f;
          console.log('   ✅ SmartEditor 발견 (iframe):', f.url().substring(0, 80));
          break;
        }
      } catch(e) {}
    }
  }

  // Method 3: Look for mainFrame
  if (!editorFrame) {
    const mainFrame = await page.$('#mainFrame');
    if (mainFrame) {
      const mf = await mainFrame.contentFrame();
      if (mf) {
        try {
          const hasSE = await mf.evaluate(() => typeof SmartEditor !== 'undefined');
          if (hasSE) {
            editorFrame = mf;
            console.log('   ✅ #mainFrame 에 SmartEditor 발견');
          }
        } catch(e) {}
      }
    }
  }

  // Method 4: Find editor iframes
  if (!editorFrame) {
    const seIframe = await page.$('iframe[src*="editor"], iframe[id*="se"], iframe.se-iframe');
    if (seIframe) {
      const sf = await seIframe.contentFrame();
      if (sf) {
        try {
          const hasSE = await sf.evaluate(() => typeof SmartEditor !== 'undefined');
          if (hasSE) {
            editorFrame = sf;
            console.log('   ✅ SE iframe 에 SmartEditor 발견');
          }
        } catch(e) {}
      }
    }
  }

  if (!editorFrame) {
    console.log('   ❌ SmartEditor를 찾을 수 없음.');
    console.log('\n   현재 프레임 목록:');
    for (const f of page.frames()) {
      try {
        const url = f.url().substring(0, 100);
        console.log(`   - ${url}`);
      } catch(e) {}
    }
    await page.screenshot({ path: path.join(WORKSPACE, 'debug_edit.png') });
    console.log('\n   디버그 스크린샷: debug_edit.png');
    await page.close();
    b.disconnect();
    process.exit(1);
  }

  // Step 3: Get existing content info
  console.log('\n[3] 현재 문서 정보 확인...');
  const docInfo = await editorFrame.evaluate(() => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      if (!ed) return { error: 'blogpc001 not found' };

      // Get current content
      const data = ed.getDocumentData ? ed.getDocumentData() : '';
      const title = ed.getDocumentTitle ? ed.getDocumentTitle() : '';

      // Count image components
      const imgCount = data.match(/se-component[^>]*se-image/g)?.length || 0;

      return {
        title,
        dataLength: (typeof data === 'string' ? data : JSON.stringify(data)).length,
        imgCount,
        hasImageUploadService: !!ed._imageUploadService,
        hasComponentService: !!ed._componentService,
        editors: Object.keys(SmartEditor._editors || {}),
      };
    } catch(e) {
      return { error: e.message };
    }
  });
  console.log(`   문서 정보: ${JSON.stringify(docInfo, null, 2)}`);

  // Step 4: Upload images using file chooser approach
  console.log('\n[4] 이미지 업로드...');
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const imgPath = path.join(WORKSPACE, img.file);

    if (!fs.existsSync(imgPath)) {
      console.log(`   ❌ 파일 없음: ${img.file}`);
      continue;
    }

    console.log(`\n   ${i + 1}/${images.length} ${img.label} (${img.file}) 업로드 중...`);

    // Method A: Use file input injection via SE4 API
    const fileBuffer = fs.readFileSync(imgPath);
    const base64 = fileBuffer.toString('base64');

    const uploadResult = await editorFrame.evaluate(({ base64, fname, mime }) => {
      try {
        const ed = SmartEditor._editors['blogpc001'];
        if (!ed) return { ok: false, error: 'no editor' };

        // Convert base64 to File
        const bs = atob(base64);
        const ab = new ArrayBuffer(bs.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < bs.length; i++) ia[i] = bs.charCodeAt(i);
        const blob = new Blob([ab], { type: mime });
        const file = new File([blob], fname, { type: mime });

        // Create DataTransfer
        const dt = new DataTransfer();
        dt.items.add(file);

        // Find file input in editor
        const inputs = document.querySelectorAll('input[type="file"]');
        for (const inp of inputs) {
          Object.defineProperty(inp, 'files', {
            value: dt.files,
            writable: false
          });
          inp.dispatchEvent(new Event('change', { bubbles: true }));
          return { ok: true, method: 'fileInput' };
        }

        return { ok: false, error: 'no file input found', inputCount: inputs.length };
      } catch(e) {
        return { ok: false, error: e.message };
      }
    }, { base64, fname: img.file, mime: 'image/png' });

    console.log(`   결과: ${JSON.stringify(uploadResult)}`);

    if (!uploadResult.ok) {
      // Method B: Click photo button and use file chooser
      console.log('   file input 없음. 사진 버튼 시도...');

      // First, scroll to bottom
      await editorFrame.evaluate(() => {
        try {
          const ed = SmartEditor._editors['blogpc001'];
          if (ed && ed._canvasScrollingService) {
            ed._canvasScrollingService.scrollToBottom();
          }
        } catch(e) {}
      }).catch(() => {});
      await page.waitForTimeout(500);
      await page.keyboard.press('End');
      await page.waitForTimeout(300);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);

      // Click photo button and wait for filechooser
      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 10000 }).catch(() => null),
        editorFrame.evaluate(() => {
          // Find photo/image button in SE4 toolbar
          const buttons = document.querySelectorAll('button');
          for (const btn of buttons) {
            const html = btn.innerHTML.toLowerCase();
            const title = (btn.getAttribute('title') || '').toLowerCase();
            const cls = btn.className.toLowerCase();
            if (title.includes('사진') || cls.includes('image') || cls.includes('photo') ||
                html.includes('사진') || html.includes('이미지') || html.includes('사진') ||
                html.includes('photo') || html.includes('image')) {
              btn.click();
              return 'clicked';
            }
          }
          // Try spans inside toolbar
          const toolbarBtns = document.querySelectorAll('.se-image-toolbar-button, .se-photo-button, [class*="photo"], [class*="image"]');
          for (const btn of toolbarBtns) {
            const clickable = btn.querySelector('button, a, span');
            if (clickable) { clickable.click(); return 'clicked toolbar'; }
            btn.click();
            return 'clicked toolbar directly';
          }
          return 'not found';
        })
      ]);

      if (fileChooser) {
        await fileChooser.setFiles([imgPath]);
        console.log('   ✅ FileChooser 업로드 완료');
        await page.waitForTimeout(3000);
      } else {
        console.log('   ⚠️ FileChooser 이벤트 없음');
      }
    } else {
      console.log('   ✅ 업로드 성공');
      await page.waitForTimeout(3000);
    }
  }

  // Step 5: Save
  console.log('\n[5] 저장 버튼 클릭...');
  try {
    const saveResult = await editorFrame.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        if (btn.textContent.trim() === '저장') {
          btn.click();
          return '저장 버튼 클릭됨';
        }
        if (btn.textContent.trim() === '저장하기') {
          btn.click();
          return '저장하기 버튼 클릭됨';
        }
      }
      // Try toolbar save button
      const toolbar = document.querySelector('#toolbar, .toolbar, .se-toolbar, [class*="toolbar"]');
      if (toolbar) {
        const tbBtns = toolbar.querySelectorAll('button');
        for (const btn of tbBtns) {
          if (btn.textContent.trim().includes('저장')) {
            btn.click();
            return '툴바 저장 버튼 클릭됨: ' + btn.textContent.trim();
          }
        }
      }
      return '저장 버튼 없음';
    });
    console.log(`   ${saveResult}`);
    await page.waitForTimeout(3000);
  } catch(e) {
    console.log(`   저장 시도 중 오류: ${e.message}`);
  }

  console.log('\n=== 📋 결과 ===');
  console.log(`최종 URL: ${page.url()}`);
  console.log(`최종 제목: ${(await page.title()).substring(0, 60)}...`);

  await page.close();
  b.disconnect();
  console.log('✅ 작업 완료');
})().catch(e => {
  console.error('❌ 오류:', e.message);
  process.exit(1);
});
