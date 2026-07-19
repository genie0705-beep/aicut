// SE4 이미지 업로드 - 클립보드 붙여넣기 방식 시도
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
  console.log('=== SE4 이미지 업로드 - 클립보드 방식 ===\n');

  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];

  // Find or open editor
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
    page = await ctx.newPage();
    page.on('dialog', async d => { try { await d.accept(); } catch(e) {} });
    await page.goto(`https://blog.naver.com/${BLOG_ID}/${LOG_NO}`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(3000);
    const mfEl = await page.$('iframe[name="mainFrame"]');
    if (!mfEl) { console.log('❌ mainFrame 없음'); await b.close(); return; }
    const mf = await mfEl.contentFrame();
    if (!mf) { console.log('❌ 접근 불가'); await b.close(); return; }
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
  if (!mfEl) { console.log('mainFrame 없음'); await b.close(); return; }
  const mf = await mfEl.contentFrame();
  if (!mf) { console.log('접근 불가'); await b.close(); return; }

  // Wait for SE4
  for (let i = 0; i < 10; i++) {
    try {
      if (await mf.evaluate(() => typeof SmartEditor !== 'undefined')) break;
    } catch(e) {}
    await page.waitForTimeout(1000);
  }

  // Check initial state
  const initCount = await mf.evaluate(() => {
    const data = SmartEditor._editors['blogpc001'].getDocumentData();
    return data.document.components.length;
  });
  console.log(`초기 컴포넌트: ${initCount}`);

  // Enable clipboard permissions in Chrome if needed
  // (CDP connection may have restricted clipboard access)

  // Try clipboard paste approach for each image
  console.log('\n=== 이미지 업로드 (클립보드 + 붙여넣기) ===\n');

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const imgPath = path.join(WORKSPACE, img.file);
    if (!fs.existsSync(imgPath)) { console.log(`❌ ${img.file} 없음`); continue; }

    console.log(`${i+1}/${images.length} ${img.label}...`);

    // Read image as base64 data URL
    const fileBuffer = fs.readFileSync(imgPath);
    const base64 = fileBuffer.toString('base64');
    const mimeType = 'image/png';
    const dataUrl = `data:${mimeType};base64,${base64}`;

    // Method 1: Try clipboard API
    try {
      const clipboardResult = await page.evaluate(async (dataUrl) => {
        try {
          const response = await fetch(dataUrl);
          const blob = await response.blob();
          const item = new ClipboardItem({ [blob.type]: blob });
          await navigator.clipboard.write([item]);
          return { ok: true };
        } catch(e) {
          return { ok: false, error: e.message };
        }
      }, dataUrl);

      console.log(`  클립보드: ${JSON.stringify(clipboardResult)}`);

      if (clipboardResult.ok) {
        // Now paste into the editor
        // First focus the editor
        await mf.evaluate(() => {
          const ed = SmartEditor._editors['blogpc001'];
          if (ed._canvasScrollingService) ed._canvasScrollingService.focusFirstText();
        });
        await page.waitForTimeout(500);

        // Scroll to end
        await mf.evaluate(() => {
          const ed = SmartEditor._editors['blogpc001'];
          if (ed._canvasScrollingService) ed._canvasScrollingService.scrollToBottom();
        });
        await page.waitForTimeout(500);

        // Press Enter then paste
        await page.keyboard.press('End');
        await page.waitForTimeout(300);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);

        // Try to paste via keyboard shortcut
        await page.keyboard.press('Control+v');
        console.log('  Ctrl+V (paste) sent');
        await page.waitForTimeout(8000);
      }
    } catch(e) {
      console.log(`  클립보드 오류: ${e.message}`);
    }

    // Check component count
    const compCount = await mf.evaluate(() => {
      const data = SmartEditor._editors['blogpc001'].getDocumentData();
      return data.document.components.length;
    }).catch(() => 0);
    console.log(`  컴포넌트: ${compCount}`);
  }

  // Final check
  console.log('\n=== 최종 상태 ===');
  const finalComps = await mf.evaluate(() => {
    const data = SmartEditor._editors['blogpc001'].getDocumentData();
    const comps = data.document.components;
    const images = comps.filter(c => c['@ctype'] === 'image');
    return { total: comps.length, images: images.length };
  });
  console.log(`전체: ${finalComps.total}, 이미지: ${finalComps.images}`);

  await b.close();
})().catch(e => console.error('❌', e.message));
