// 블로그봇 최종 수정본 - mainFrame 내 SE4 접근
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
  console.log('=== 블로그봇: 포스트 수정 - 이미지 추가 ===');
  console.log(`대상: ${BLOG_ID}, logNo=${LOG_NO}\n`);

  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  page.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  // Step 1: Open blog post page
  console.log('[1] 포스트 페이지 열기 + 수정 버튼...');
  await page.goto(`https://blog.naver.com/${BLOG_ID}/${LOG_NO}`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(3000);
  console.log(`   현재 URL: ${page.url().substring(0, 100)}`);

  // Get mainFrame from the blog page
  const mfEl = await page.$('iframe[name="mainFrame"]');
  if (!mfEl) {
    console.log('❌ mainFrame iframe 없음');
    await b.close();
    return;
  }

  // Access mainFrame
  const mf = await mfEl.contentFrame();
  if (!mf) {
    console.log('❌ mainFrame 접근 불가');
    await b.close();
    return;
  }
  console.log(`   mainFrame URL: ${mf.url().substring(0, 100)}`);

  // Click 수정 (edit) button
  await mf.evaluate(() => {
    const links = document.querySelectorAll('a');
    for (const link of links) {
      if (link.textContent.trim() === '수정' && link.getAttribute('href')?.includes('suggestConvert')) {
        link.click();
        break;
      }
    }
  });
  console.log('   ✅ 수정 버튼 클릭됨');

  // Wait for mainFrame to navigate to postupdate
  await page.waitForTimeout(5000);
  console.log(`   mainFrame URL: ${mf.url().substring(0, 100)}`);

  // Verify SmartEditor is available in mainFrame
  let seReady = false;
  for (let i = 0; i < 10; i++) {
    try {
      const hasSE = await mf.evaluate(() => typeof SmartEditor !== 'undefined');
      if (hasSE) { seReady = true; break; }
    } catch(e) {}
    await page.waitForTimeout(1000);
  }

  if (!seReady) {
    console.log('❌ SmartEditor 로드 실패');
    await b.close();
    return;
  }
  console.log('   ✅ SmartEditor 준비 완료');

  // Check initial document state via mainFrame
  console.log('\n[2] 초기 문서 상태...');
  const initState = await mf.evaluate(() => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      const body = ed._document.getBody();
      let imgCount = 0;
      let comps = [];
      let totalComps = 0;
      if (body && body.getChildren) {
        const children = body.getChildren();
        totalComps = children.length;
        comps = Array.from(children).map((c, i) => {
          const type = c['@ctype'] || c.type || c.constructor?.name || '?';
          let text = '';
          try { text = (c.innerText || '').substring(0, 25); } catch(e) {}
          if (type.toLowerCase().includes('image')) imgCount++;
          return { idx: i, type, text };
        });
      }
      return { imgCount, totalComps, comps: comps.slice(0, 15) };
    } catch(e) {
      return { error: e.message };
    }
  });
  console.log(`   이미지: ${initState.imgCount}장, 전체 컴포넌트: ${initState.totalComps}`);
  if (initState.comps) {
    initState.comps.forEach(c => console.log(`     [${c.idx}] ${c.type} - "${c.text}"`));
  }

  // Step 3: Upload images
  console.log('\n[3] 이미지 업로드...');

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const imgPath = path.join(WORKSPACE, img.file);

    if (!fs.existsSync(imgPath)) {
      console.log(`   ❌ ${img.file} 없음, 건너뜀`);
      continue;
    }

    console.log(`\n   ${i+1}/${images.length} ${img.label} (${img.file})`);

    // Scroll editor to end
    await mf.evaluate(() => {
      try {
        const ed = SmartEditor._editors['blogpc001'];
        if (ed._canvasScrollingService) ed._canvasScrollingService.scrollToBottom();
      } catch(e) {}
    });
    await page.waitForTimeout(500);

    // Press End + Enter to create paragraph at end - use mainFrame for keyboard
    await page.keyboard.press('End');
    await page.waitForTimeout(300);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Click 사진 button in mainFrame and wait for filechooser
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 10000 }).catch(() => null),
      mf.evaluate(() => {
        const btns = document.querySelectorAll('button');
        for (const btn of btns) {
          const text = btn.textContent.trim();
          if (text.includes('사진') && text.includes('추가') && btn.offsetParent !== null) {
            btn.click();
            return 'clicked: ' + text.substring(0, 20);
          }
        }
        // Try by class
        const toolBtn = document.querySelector('.se-image-toolbar-button button');
        if (toolBtn) { toolBtn.click(); return 'clicked se-image-toolbar'; }
        return 'not found';
      })
    ]);

    if (fileChooser) {
      await fileChooser.setFiles([imgPath]);
      console.log(`     ✅ 파일 선택됨 (${Math.round(fs.statSync(imgPath).size/1024)}KB)`);
      console.log('     ⏳ SE4 처리 대기 중...');

      // Wait for SE4 to upload and insert image
      await page.waitForTimeout(15000);
    } else {
      console.log(`     ⚠️ FileChooser 없음`);
    }
  }

  // Step 4: Check document after upload
  console.log('\n[4] 업로드 완료 후 문서 상태...');
  await page.waitForTimeout(2000);

  const afterState = await mf.evaluate(() => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      const body = ed._document.getBody();
      let imgCount = 0;
      let totalComps = 0;
      let comps = [];
      if (body && body.getChildren) {
        const children = body.getChildren();
        totalComps = children.length;
        comps = Array.from(children).map((c, i) => {
          const type = c['@ctype'] || c.type || c.constructor?.name || '?';
          let text = '';
          try { text = (c.innerText || '').substring(0, 25); } catch(e) {}
          if (type.toLowerCase().includes('image')) imgCount++;
          return { idx: i, type, text };
        });
      }
      return { imgCount, totalComps, comps: comps.slice(0, 15) };
    } catch(e) {
      return { error: e.message };
    }
  });
  console.log(`   이미지: ${afterState.imgCount}장, 전체: ${afterState.totalComps}개 컴포넌트`);
  if (afterState.comps) {
    afterState.comps.forEach(c => console.log(`     [${c.idx}] ${c.type} - "${c.text}"`));
  }

  // Step 5: Save (click 발행)
  console.log('\n[5] 저장...');
  const saveClicked = await mf.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.textContent.trim() === '발행' && btn.offsetParent !== null) {
        btn.click();
        return 'clicked: 발행 (' + btn.className + ')';
      }
    }
    return '발행 button not found';
  });
  console.log(`   ${saveClicked}`);

  await page.waitForTimeout(5000);
  console.log(`   저장 후 URL: ${page.url().substring(0, 100)}`);
  console.log(`   저장 후 mainFrame URL: ${mf.url().substring(0, 100)}`);

  console.log('\n=== 📋 작업 완료 ===');
  console.log('저장됨:', !mf.url().includes('postupdate') ? '✅ 예' : '⚠️ 아직 에디터');

  await b.close();
})().catch(e => {
  console.error('❌ 오류:', e.message);
  process.exit(1);
});
