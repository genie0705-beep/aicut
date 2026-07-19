// SE4 이미지 업로드 v2 - file input 직접 제어
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

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
  console.log('=== 블로그봇: SE4 직접 파일 업로드 v2 ===\n');

  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];

  // Check if editor is already open
  let page = null;
  for (const p of ctx.pages()) {
    const frames = p.frames();
    for (const f of frames) {
      if (f.name() === 'mainFrame') {
        try {
          const hasSE = await f.evaluate(() => typeof SmartEditor !== 'undefined');
          if (hasSE) {
            page = p;
            console.log('✅ 기존 에디터 페이지 발견');
            break;
          }
        } catch(e) {}
      }
    }
    if (page) break;
  }

  // If not, open editor
  if (!page) {
    console.log('📄 새 에디터 열기...');
    page = await ctx.newPage();
    page.on('dialog', async d => { try { await d.accept(); } catch(e) {} });
    await page.goto(`https://blog.naver.com/${BLOG_ID}/${LOG_NO}`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(3000);

    const mfEl = await page.$('iframe[name="mainFrame"]');
    if (!mfEl) { console.log('❌ mainFrame 없음'); await b.close(); return; }
    const mf = await mfEl.contentFrame();
    if (!mf) { console.log('❌ mainFrame 접근 불가'); await b.close(); return; }

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

  // Get mainFrame
  const mfEl = await page.$('iframe[name="mainFrame"]');
  if (!mfEl) { console.log('❌ mainFrame 없음'); await b.close(); return; }
  const mf = await mfEl.contentFrame();
  if (!mf) { console.log('❌ mainFrame 접근 불가'); await b.close(); return; }

  console.log(`mainFrame URL: ${mf.url().substring(0, 100)}`);

  // Wait for SE4
  for (let i = 0; i < 10; i++) {
    try {
      const hasSE = await mf.evaluate(() => typeof SmartEditor !== 'undefined');
      if (hasSE) break;
    } catch(e) {}
    await page.waitForTimeout(1000);
  }

  // Check current components
  const initialComps = await mf.evaluate(() => {
    const data = SmartEditor._editors['blogpc001'].getDocumentData();
    const comps = data.document.components;
    return comps.map((c, i) => ({
      idx: i,
      ctype: c['@ctype'] || '?',
      textPreview: JSON.stringify(c).substring(0, 100)
    }));
  });
  console.log('\n초기 컴포넌트:');
  initialComps.forEach(c => console.log(`  [${c.idx}] ${c.ctype}`));

  // Now try DataTransfer approach for each image
  console.log('\n=== 이미지 업로드 (DataTransfer 방식) ===\n');

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const imgPath = path.join(WORKSPACE, img.file);
    if (!fs.existsSync(imgPath)) { console.log(`❌ ${img.file} 없음`); continue; }

    console.log(`${i+1}/${images.length} ${img.label}...`);

    // Read file as base64
    const fileBuffer = fs.readFileSync(imgPath);
    const base64 = fileBuffer.toString('base64');
    const mimeType = 'image/png';

    // Method: Create DataTransfer in SE4 context, find file input, set files
    const result = await mf.evaluate(({ base64, mime, fname }) => {
      try {
        const ed = SmartEditor._editors['blogpc001'];

        // Convert base64 to File
        const byteStr = atob(base64);
        const ab = new ArrayBuffer(byteStr.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteStr.length; i++) ia[i] = byteStr.charCodeAt(i);
        const blob = new Blob([ab], { type: mime });
        const file = new File([blob], fname, { type: mime });

        // Create DataTransfer
        const dt = new DataTransfer();
        dt.items.add(file);

        // Find ALL file inputs in the document
        const fileInputs = document.querySelectorAll('input[type="file"]');
        let usedInput = null;

        for (const inp of fileInputs) {
          if (inp.offsetParent !== null || inp.style.display !== 'none') {
            // Set files via DataTransfer
            Object.defineProperty(inp, 'files', {
              value: dt.files,
              writable: true
            });
            // Trigger change event
            inp.dispatchEvent(new Event('change', { bubbles: true }));
            usedInput = inp.className || 'found';
            break;
          }
        }

        if (!usedInput) {
          // Try the hidden file input that SE4 creates for photo upload
          for (const inp of fileInputs) {
            Object.defineProperty(inp, 'files', {
              value: dt.files,
              writable: true
            });
            inp.dispatchEvent(new Event('change', { bubbles: true }));
            usedInput = 'hidden:' + inp.className || inp.id;
            break;
          }
        }

        return { ok: !!usedInput, method: usedInput || 'no file input' };
      } catch(e) {
        return { ok: false, error: e.message };
      }
    }, { base64, mime: mimeType, fname: img.file });

    console.log(`  결과: ${JSON.stringify(result)}`);

    // Wait for upload to complete
    await page.waitForTimeout(5000);

    // Check if image was added
    const compsAfter = await mf.evaluate(() => {
      const data = SmartEditor._editors['blogpc001'].getDocumentData();
      return data.document.components.length;
    }).catch(() => 0);
    console.log(`  컴포넌트 수: ${compsAfter}`);
  }

  // Check final state
  console.log('\n=== 최종 문서 상태 ===');
  const finalComps = await mf.evaluate(() => {
    const data = SmartEditor._editors['blogpc001'].getDocumentData();
    return data.document.components.map((c, i) => ({
      idx: i,
      ctype: c['@ctype'] || '?',
      imgCount: c['@ctype'] === 'image' ? 1 : 0
    }));
  });
  const totalImages = finalComps.filter(c => c.ctype === 'image').length;
  console.log(`전체 컴포넌트: ${finalComps.length}, 이미지: ${totalImages}장`);
  finalComps.forEach(c => console.log(`  [${c.idx}] ${c.ctype}`));

  // Save
  if (totalImages > 0) {
    console.log('\n=== 저장 ===');
    page.on('dialog', async d => { console.log(`  다이얼로그: ${d.message().substring(0, 80)}`); await d.accept(); });

    await mf.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        if (btn.textContent.trim() === '발행' && btn.offsetParent !== null) {
          btn.click(); return;
        }
      }
    });
    await page.waitForTimeout(5000);
    console.log(`저장 후 mainFrame: ${mf.url().substring(0, 100)}`);
  }

  await b.close();
})().catch(e => console.error('❌', e.message));
