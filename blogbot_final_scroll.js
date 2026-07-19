// 블로그봇 최종: 스크롤 보정 + 이미지 업로드 + 저장
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
  console.log('=== 블로그봇 최종: 스크롤 보정 + 이미지 업로드 ===\n');

  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];

  // Find editor page
  let page = null;
  let mainFrame = null;

  for (const p of ctx.pages()) {
    const frames = p.frames();
    for (const f of frames) {
      if (f.name() === 'mainFrame') {
        try {
          if (await f.evaluate(() => typeof SmartEditor !== 'undefined')) {
            page = p;
            mainFrame = f;
            break;
          }
        } catch(e) {}
      }
    }
    if (page) break;
  }

  if (!page) {
    console.log('🔧 새 에디터 열기...');
    page = await ctx.newPage();
    page.on('dialog', async d => { try { await d.accept(); } catch(e) {} });
    await page.goto(`https://blog.naver.com/${BLOG_ID}/${LOG_NO}`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(3000);
    const mfEl = await page.$('iframe[name="mainFrame"]');
    if (!mfEl) { console.log('❌ mainFrame 없음'); await b.close(); return; }
    mainFrame = await mfEl.contentFrame();
    if (!mainFrame) { console.log('❌ 접근 불가'); await b.close(); return; }
    await mainFrame.evaluate(() => {
      const links = document.querySelectorAll('a');
      for (const link of links) {
        if (link.textContent.trim() === '수정' && link.getAttribute('href')?.includes('suggestConvert')) {
          link.click(); break;
        }
      }
    });
    await page.waitForTimeout(5000);
    // Re-find mainFrame
    const mfEl2 = await page.$('iframe[name="mainFrame"]');
    if (mfEl2) mainFrame = await mfEl2.contentFrame();
  }

  if (!mainFrame) { console.log('❌ mainFrame 접근 불가'); await b.close(); return; }

  // Wait for SE4
  for (let i = 0; i < 15; i++) {
    try {
      if (await mainFrame.evaluate(() => typeof SmartEditor !== 'undefined')) {
        console.log('✅ SE4 준비 완료');
        break;
      }
    } catch(e) {}
    await page.waitForTimeout(1000);
  }

  // Get initial component count
  const initialCompCount = await mainFrame.evaluate(() => {
    return SmartEditor._editors['blogpc001'].getDocumentData().document.components.length;
  });
  console.log(`초기 컴포넌트: ${initialCompCount}\n`);

  // Step: Upload each image
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const imgPath = path.join(WORKSPACE, img.file);
    if (!fs.existsSync(imgPath)) { console.log(`❌ ${img.file} 없음`); continue; }

    console.log(`[${i+1}/${images.length}] ${img.label}`);

    // **** KEY FIX: Scroll window to left to make 사진 button visible ****
    await mainFrame.evaluate(() => {
      window.scrollTo(0, 0);
      // The horizontal scroll (window.scrollX) is what pushes buttons offscreen
    });
    await page.waitForTimeout(200);

    // Also scroll the toolbar to make 사진 button visible
    await mainFrame.evaluate(() => {
      const toolbar = document.querySelector('.se-document-toolbar');
      if (toolbar) {
        toolbar.scrollLeft = 0;
      }
      // Also try to scroll the toolbar's parent
      const toolbars = document.querySelectorAll('.se-toolbar');
      toolbars.forEach(tb => { tb.scrollLeft = 0; });
    });
    await page.waitForTimeout(200);

    // Now check if the 사진 button is visible
    const btnVisible = await mainFrame.evaluate(() => {
      const btn = document.querySelector('.se-image-toolbar-button');
      if (!btn) return 'no button';
      const rect = btn.getBoundingClientRect();
      return { x: rect.x, y: rect.y, visible: rect.x >= 0 && rect.y >= 0 };
    });
    console.log(`  버튼 위치: x=${btnVisible.x}, y=${btnVisible.y}, visible=${btnVisible.visible}`);

    // Click the 사진 button with proper scrolling
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 10000 }).catch(() => null),
      mainFrame.evaluate(() => {
        const btn = document.querySelector('.se-image-toolbar-button');
        if (btn) {
          // Scroll into view first
          btn.scrollIntoView({ block: 'nearest', inline: 'nearest' });
          btn.click();
          return 'clicked';
        }
        return 'btn not found';
      })
    ]);

    if (fileChooser) {
      console.log(`  ✅ FileChooser: ${img.file} 설정`);
      await fileChooser.setFiles([imgPath]);
      
      // Wait for SE4 upload
      console.log('  ⏳ 처리 대기...');
      for (let w = 0; w < 25; w++) {
        await page.waitForTimeout(1000);
        try {
          const currCount = await mainFrame.evaluate(() => {
            return SmartEditor._editors['blogpc001'].getDocumentData().document.components.length;
          });
          if (currCount > initialCompCount + i) {
            console.log(`  ✅ 이미지 삽입됨! (${initialCompCount + i} → ${currCount})`);
            break;
          }
          if (w % 5 === 4) console.log(`  ...${w+1}초 대기 중`);
        } catch(e) { break; }
      }
    } else {
      console.log(`  ⚠️ FileChooser 없음. 하드웨어 클릭 시도...`);
      
      // Try Playwright's native click which handles visibility
      const imgBtn = await mainFrame.$('.se-image-toolbar-button');
      if (imgBtn) {
        const [fc2] = await Promise.all([
          page.waitForEvent('filechooser', { timeout: 8000 }).catch(() => null),
          imgBtn.click({ force: true }).catch(() => {})
        ]);
        if (fc2) {
          await fc2.setFiles([imgPath]);
          console.log('  ✅ Playwright 클릭 + FileChooser 성공');
          await page.waitForTimeout(10000);
        } else {
          console.log('  ❌ Playwright 클릭도 실패');
        }
      }
    }
  }

  // Final check
  console.log('\n=== 최종 문서 ===');
  const finalState = await mainFrame.evaluate(() => {
    const data = SmartEditor._editors['blogpc001'].getDocumentData();
    const comps = data.document.components;
    const images = comps.filter(c => c['@ctype'] === 'image');
    return { total: comps.length, images: images.length };
  });
  console.log(JSON.stringify(finalState));

  // Save
  if (finalState.images > 0) {
    console.log('\n=== 저장 ===');
    const saveResult = await mainFrame.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        if (btn.textContent.trim() === '발행' && btn.offsetParent !== null) {
          btn.scrollIntoView({ block: 'center' });
          btn.click();
          return 'clicked: 발행';
        }
      }
      return 'not found';
    });
    console.log(saveResult);
    await page.waitForTimeout(5000);
    console.log(`저장 후 URL: ${mainFrame.url().substring(0, 100)}`);
  }

  await b.close();
  console.log('\n✅ 작업 완료');
})().catch(e => console.error('❌', e.message));
