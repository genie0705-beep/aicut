// 블로그봇 완전체: 전체 워크플로우 한 번에
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
  console.log('=== 블로그봇: 전체 워크플로우 ===');
  console.log(`대상: ${BLOG_ID}, logNo=${LOG_NO}\n`);

  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  // Accept all dialogs automatically
  page.on('dialog', async d => {
    console.log(`  📋 다이얼로그: ${d.type()} - ${d.message().substring(0, 80)}`);
    await d.accept();
  });

  // === [1] 포스트 열기 + 수정 모드 ===
  console.log('[1] 포스트 열기 + 수정 모드');
  await page.goto(`https://blog.naver.com/${BLOG_ID}/${LOG_NO}`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(3000);

  const mfEl = await page.$('iframe[name="mainFrame"]');
  if (!mfEl) { console.log('❌ mainFrame 없음'); await b.close(); return; }
  const mf = await mfEl.contentFrame();
  if (!mf) { console.log('❌ 접근 불가'); await b.close(); return; }

  // Click 수정
  await mf.evaluate(() => {
    const links = document.querySelectorAll('a');
    for (const link of links) {
      if (link.textContent.trim() === '수정' && link.getAttribute('href')?.includes('suggestConvert')) {
        link.click(); break;
      }
    }
  });
  await page.waitForTimeout(5000);
  console.log('   ✅ 수정 모드 진입');
  console.log(`   mainFrame: ${mf.url().substring(0, 80)}`);

  // Wait for SE4
  for (let i = 0; i < 15; i++) {
    try {
      if (await mf.evaluate(() => typeof SmartEditor !== 'undefined' && !!SmartEditor._editors['blogpc001'])) {
        console.log('   ✅ SE4 준비');
        break;
      }
    } catch(e) {}
    await page.waitForTimeout(1000);
  }

  const initCompCount = await mf.evaluate(() => {
    return SmartEditor._editors['blogpc001'].getDocumentData().document.components.length;
  });
  console.log(`   초기 컴포넌트: ${initCompCount}\n`);

  // === [2] 이미지 업로드 ===
  console.log('[2] 이미지 업로드');
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const imgPath = path.join(WORKSPACE, img.file);
    if (!fs.existsSync(imgPath)) { console.log(`❌ ${img.file} 없음`); continue; }

    console.log(`\n   ${i+1}/${images.length} ${img.label}`);

    // Scroll window + toolbar to make 사진 button visible
    await mf.evaluate(() => {
      window.scrollTo(0, 0);
      const toolbar = document.querySelector('.se-document-toolbar');
      if (toolbar) toolbar.scrollLeft = 0;
      document.querySelectorAll('.se-toolbar').forEach(tb => { tb.scrollLeft = 0; });
    });
    await page.waitForTimeout(300);

    // Click 사진 button → filechooser → upload
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 10000 }).catch(() => null),
      mf.evaluate(() => {
        const btn = document.querySelector('.se-image-toolbar-button');
        if (btn) { btn.scrollIntoView(); btn.click(); return 'clicked'; }
        return 'not found';
      })
    ]);

    if (fileChooser) {
      await fileChooser.setFiles([imgPath]);
      // Wait for SE4 to process the upload
      for (let w = 0; w < 20; w++) {
        await page.waitForTimeout(1000);
        try {
          const currCount = await mf.evaluate(() => {
            return SmartEditor._editors['blogpc001'].getDocumentData().document.components.length;
          });
          if (currCount > initCompCount + i) {
            console.log(`      ✅ 삽입됨 → ${currCount}개 컴포넌트`);
            break;
          }
        } catch(e) { break; }
      }
    } else {
      console.log('      ⚠️ FileChooser 실패');
    }
  }

  // === [3] 저장 ===
  console.log('\n[3] 저장');
  const finalCount = await mf.evaluate(() => {
    return SmartEditor._editors['blogpc001'].getDocumentData().document.components.length;
  });
  console.log(`   최종 컴포넌트: ${finalCount}`);

  // Step 3a: Click 발행 (opens publish popup)
  console.log('   클릭: 발행 (팝업 열기)');
  await mf.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.textContent.trim() === '발행' && btn.offsetParent !== null && !btn.closest('.layer_popup')) {
        btn.scrollIntoView({ block: 'center' });
        btn.click();
        return;
      }
    }
  });
  await page.waitForTimeout(2000);

  // Step 3b: Click 발행 in popup (confirm publish)
  console.log('   대기: 발행 팝업...');
  let popupConfirmed = false;
  for (let i = 0; i < 10; i++) {
    const popupResult = await mf.evaluate(() => {
      const popup = document.querySelector('.layer_popup__i0QOY.is_show__TMSLq');
      if (popup) {
        const btns = popup.querySelectorAll('button');
        for (const btn of btns) {
          if (btn.textContent.trim() === '발행') {
            btn.click();
            return { found: true, clicked: true };
          }
        }
        return { found: true, clicked: false, buttons: Array.from(btns).map(b => b.textContent.trim()) };
      }
      return { found: false };
    });

    if (popupResult.found && popupResult.clicked) {
      console.log('   ✅ 팝업 내 발행 확인 버튼 클릭');
      popupConfirmed = true;
      break;
    }
    await page.waitForTimeout(1000);
  }

  if (!popupConfirmed) {
    console.log('   ⚠️ 팝업 없음. Ctrl+Enter 시도...');
    await page.keyboard.press('Control+Enter');
  }

  // Step 3c: Wait for save
  console.log('   저장 완료 대기...');
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(1000);
    try {
      const url = mf.url();
      if (!url.includes('postupdate')) {
        console.log(`   ✅ 저장됨! (${i+1}초)`);
        console.log(`   → ${url.substring(0, 100)}`);
        break;
      }
      if (i % 10 === 9) console.log(`   ...${i+1}초`);
    } catch(e) {
      console.log(`   ${i+1}초: ${e.message}`);
    }
  }

  // === [4] 확인 ===
  console.log('\n[4] 공개 포스트 확인');
  const vp = await ctx.newPage();
  await vp.goto(`https://blog.naver.com/${BLOG_ID}/${LOG_NO}`, { waitUntil: 'networkidle', timeout: 20000 });
  await vp.waitForTimeout(4000);

  const frames = vp.frames();
  for (const f of frames) {
    if (f.name() === 'mainFrame') {
      const postInfo = await f.evaluate(() => {
        const imgs = document.querySelectorAll('img');
        const bigImgs = Array.from(imgs).filter(i => (i.width || 0) > 100);
        return {
          totalImgs: imgs.length,
          contentImgs: bigImgs.length,
          sampleSrc: bigImgs.length > 0 ? (bigImgs[0].src || '').substring(0, 80) : 'none',
        };
      });
      console.log(`   ${JSON.stringify(postInfo)}`);
      break;
    }
  }

  await vp.close();
  await b.close();
  console.log('\n✅ 작업 완료');
})().catch(e => {
  console.error('❌ 오류:', e.message);
  process.exit(1);
});
