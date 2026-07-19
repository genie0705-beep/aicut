// 최종: 직접 file input 생성 + SE4 API로 이미지 컴포넌트 삽입
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BLOG_ID = 'aicut';
const LOG_NO = '224341544476';
const WORKSPACE = 'C:\\Users\\paul\\.openclaw\\workspace';

const images = [
  { file: 'aicut_implant_main.png', label: '대표 이미지', pos: 'after_intro' },
  { file: 'aicut_implant_card1.png', label: '본문카드1', pos: 'after_trust' },
  { file: 'aicut_implant_card2.png', label: '본문카드2', pos: 'after_outsource' },
  { file: 'aicut_implant_card3.png', label: '본문카드3', pos: 'after_reason' },
  { file: 'aicut_implant_cta.png', label: 'CTA 이미지', pos: 'before_cta' },
];

(async () => {
  console.log('=== 블로그봇 최종: 직접 이미지 업로드 + SE4 삽입 ===\n');

  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];

  // 1. Find or open editor
  let page = null;
  for (const p of ctx.pages()) {
    const frames = p.frames();
    for (const f of frames) {
      if (f.name() === 'mainFrame') {
        try {
          if (await f.evaluate(() => typeof SmartEditor !== 'undefined')) {
            page = p;
            break;
          }
        } catch(e) {}
      }
    }
    if (page) break;
  }

  if (!page) {
    console.log('📄 새 에디터 열기...');
    page = await ctx.newPage();
    page.on('dialog', async d => { try { await d.accept(); } catch(e) {} });
    await page.goto(`https://blog.naver.com/${BLOG_ID}/${LOG_NO}`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(3000);
    const mfEl = await page.$('iframe[name="mainFrame"]');
    if (!mfEl) { console.log('mainFrame 없음'); await b.close(); return; }
    const mf = await mfEl.contentFrame();
    if (!mf) { console.log('접근 불가'); await b.close(); return; }
    await mf.evaluate(() => {
      const links = document.querySelectorAll('a');
      for (const link of links) {
        if (link.textContent.trim() === '수정' && link.getAttribute('href')?.includes('suggestConvert')) {
          link.click(); break;
        }
      }
    });
    await page.waitForTimeout(5000);
  }

  const mfEl = await page.$('iframe[name="mainFrame"]');
  if (!mfEl) { console.log('mainFrame 없음'); await b.close(); return; }
  const mf = await mfEl.contentFrame();
  if (!mf) { console.log('접근 불가'); await b.close(); return; }

  // Wait for SE4
  for (let i = 0; i < 15; i++) {
    try {
      if (await mf.evaluate(() => typeof SmartEditor !== 'undefined')) break;
    } catch(e) {}
    await page.waitForTimeout(1000);
  }

  // Get current document
  const docData = await mf.evaluate(() => {
    const data = SmartEditor._editors['blogpc001'].getDocumentData();
    return { compCount: data.document.components.length, docId: data.documentId };
  });
  console.log(`문서: ${docData.compCount}개 컴포넌트, docId: ${docData.docId}\n`);

  // Get initial components for reference
  const initialComps = await mf.evaluate(() => {
    const data = SmartEditor._editors['blogpc001'].getDocumentData();
    return data.document.components;
  });

  // Now the main approach: For each image, upload via 사진 button properly
  // First, scroll the toolbar to make 사진 button visible
  console.log('툴바 스크롤 + 이미지 업로드...\n');

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const imgPath = path.join(WORKSPACE, img.file);
    if (!fs.existsSync(imgPath)) { console.log(`❌ ${img.file} 없음`); continue; }

    console.log(`[${i+1}/${images.length}] ${img.label}`);

    // Step 1: Scroll toolbar left to make 사진 button visible
    // The se-toolbar container scrolls horizontally
    await mf.evaluate(() => {
      const toolbar = document.querySelector('.se-document-toolbar');
      if (toolbar) {
        // Scroll all the way to the left (start of toolbar)
        toolbar.scrollLeft = 0;
      }
      // Also scroll the toolbar items
      const item = document.querySelector('.se-toolbar-item-image');
      if (item) {
        item.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    });
    await page.waitForTimeout(500);

    // Step 2: Create a file input programmatically and trigger it
    const fileBuffer = fs.readFileSync(imgPath);
    const base64 = fileBuffer.toString('base64');
    const mimeType = 'image/png';

    const uploadResult = await mf.evaluate(({ base64, mime, fname }) => {
      const results = {};

      try {
        // Convert to File
        const bs = atob(base64);
        const ab = new ArrayBuffer(bs.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < bs.length; i++) ia[i] = bs.charCodeAt(i);
        const blob = new Blob([ab], { type: mime });
        const file = new File([blob], fname, { type: mime });

        // Create DataTransfer
        const dt = new DataTransfer();
        dt.items.add(file);

        // Method 1: Try clicking the 사진 button and intercepting
        const imageBtn = document.querySelector('.se-image-toolbar-button');
        if (imageBtn) {
          // Click the button to trigger file input creation
          imageBtn.click();
          results.btnClicked = true;
        } else {
          results.btnClicked = false;
        }

        // Wait a moment for React to process
        return { ...results, fileSize: file.size };
      } catch(e) {
        return { ...results, error: e.message };
      }
    }, { base64, mime: mimeType, fname: img.file });

    console.log(`  버튼 클릭: ${JSON.stringify(uploadResult)}`);

    // Step 3: Wait for filechooser
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 8000 }).catch(() => null),
      new Promise(resolve => setTimeout(resolve, 500))
    ]);

    if (fileChooser) {
      console.log('  ✅ FileChooser 캡처됨');
      await fileChooser.setFiles([imgPath]);
      console.log('  ✅ 파일 설정됨');
      
      // Step 4: Wait for upload to complete (SE4 processes the file)
      // Monitor for new components
      console.log('  ⏳ SE4 처리 대기...');
      
      // Wait longer - the upload goes to Naver CDN
      for (let w = 0; w < 20; w++) {
        await page.waitForTimeout(1000);
        
        // Check if a new component was added
        const compCount = await mf.evaluate(() => {
          try {
            return SmartEditor._editors['blogpc001'].getDocumentData().document.components.length;
          } catch(e) { return -1; }
        });
        
        if (compCount > initialComps.length) {
          console.log(`  ✅ 이미지 삽입됨! (컴포넌트: ${initialComps.length} → ${compCount})`);
          break;
        }
        
        if (w === 19) {
          console.log(`  ⚠️ ${w+1}초 후에도 삽입 안 됨`);
        }
      }
    } else {
      console.log('  ⚠️ FileChooser 없음. 대체 방법 시도...');
      
      // Alternative: Directly inject the image via component API
      const injectResult = await mf.evaluate(({ base64, mime, fname }) => {
        try {
          const ed = SmartEditor._editors['blogpc001'];
          const es = ed._editingService;
          
          // Convert to File
          const bs = atob(base64);
          const ab = new ArrayBuffer(bs.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < bs.length; i++) ia[i] = bs.charCodeAt(i);
          const blob = new Blob([ab], { type: mime });
          const file = new File([blob], fname, { type: mime });
          
          // Create DataTransfer
          const dt = new DataTransfer();
          dt.items.add(file);
          
          // Find file input that SE4 might have created
          const inputs = document.querySelectorAll('input[type="file"]');
          for (const inp of inputs) {
            Object.defineProperty(inp, 'files', { value: dt.files, writable: false });
            inp.dispatchEvent(new Event('change', { bubbles: true }));
            return { ok: true, method: 'fileInput_' + inputs.length };
          }
          
          // If no inputs, create one and dispatch
          const newInput = document.createElement('input');
          newInput.type = 'file';
          newInput.accept = 'image/*';
          newInput.multiple = false;
          Object.defineProperty(newInput, 'files', { value: dt.files, writable: false });
          document.body.appendChild(newInput);
          newInput.dispatchEvent(new Event('change', { bubbles: true }));
          return { ok: true, method: 'created_input' };
          
        } catch(e) {
          return { ok: false, error: e.message };
        }
      }, { base64, mime: mimeType, fname: img.file });
      
      console.log(`  대체 결과: ${JSON.stringify(injectResult)}`);
      await page.waitForTimeout(5000);
    }
  }

  // Final check
  console.log('\n=== 최종 문서 상태 ===');
  const finalState = await mf.evaluate(() => {
    const data = SmartEditor._editors['blogpc001'].getDocumentData();
    const comps = data.document.components;
    const images = comps.filter(c => c['@ctype'] === 'image');
    const textCount = comps.filter(c => c['@ctype'] === 'text').length;
    return { total: comps.length, images: images.length, texts: textCount };
  });
  console.log(JSON.stringify(finalState, null, 2));

  // Save if images were added
  if (finalState.images > 0) {
    console.log('\n=== 저장 ===');
    
    // Scroll toolbar left to find 발행 button
    await mf.evaluate(() => {
      // The 발행 button is in the header, not the document toolbar
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        if (btn.textContent.trim() === '발행' && btn.offsetParent !== null) {
          btn.scrollIntoView({ block: 'center' });
          btn.click();
          return;
        }
      }
    });
    await page.waitForTimeout(5000);
    console.log(`저장 후 mainFrame: ${mf.url().substring(0, 80)}`);
  }

  await b.close();
  console.log('\n✅ 작업 완료');
})().catch(e => console.error('❌', e.message));
