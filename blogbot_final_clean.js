// 블로그봇 최종: 깨끗한 상태에서 시작 - 이미지 업로드 + 저장
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

  // Step 1: Open post and click edit
  console.log('[1] 포스트 페이지 → 수정 모드 진입...');
  await page.goto(`https://blog.naver.com/${BLOG_ID}/${LOG_NO}`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(3000);
  console.log(`   Blog page loaded: ${page.url().substring(0, 80)}`);

  // Find mainFrame and click 수정
  const mfEl = await page.$('iframe[name="mainFrame"]');
  if (!mfEl) { console.log('❌ mainFrame not found'); await b.close(); return; }
  const mf = await mfEl.contentFrame();
  if (!mf) { console.log('❌ cannot access mainFrame'); await b.close(); return; }

  await mf.evaluate(() => {
    const links = document.querySelectorAll('a');
    for (const link of links) {
      if (link.textContent.trim() === '수정' && link.getAttribute('href')?.includes('suggestConvert')) {
        link.click();
        return;
      }
    }
  });
  await page.waitForTimeout(5000);
  console.log(`   Edit clicked. Current URL: ${page.url().substring(0, 80)}`);

  // Wait for editor to fully load
  await page.waitForTimeout(3000);

  // Find the postupdate page (might be new tab or redirect)
  let editorPage = page;
  for (const p of ctx.pages()) {
    if (p.url().includes('postupdate') && p.url().includes(LOG_NO)) {
      editorPage = p;
      break;
    }
  }
  console.log(`   Editor page: ${editorPage.url().substring(0, 80)}`);

  // Wait for SmartEditor to fully initialize
  await editorPage.waitForTimeout(3000);

  // Check initial document state
  const initState = await editorPage.evaluate(() => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      const data = ed.getDocumentData();
      const str = typeof data === 'string' ? data : JSON.stringify({ doc: data.document });
      // Get components count from document body
      let imgCount = 0;
      try {
        const body = ed._document.getBody();
        if (body && body.getChildren) {
          const children = body.getChildren();
          imgCount = Array.from(children).filter(c => {
            const type = c['@ctype'] || c.type || '';
            return type.toLowerCase().includes('image');
          }).length;
        }
      } catch(e) {}
      return { imgCount, dataLen: str.length };
    } catch(e) {
      return { error: e.message };
    }
  });
  console.log(`   초기 상태: 이미지 ${initState.imgCount}장, 데이터 길이 ${initState.dataLen}`);

  // Step 2: Upload images via 사진 button + filechooser
  console.log('\n[2] 이미지 업로드...');

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const imgPath = path.join(WORKSPACE, img.file);

    if (!fs.existsSync(imgPath)) {
      console.log(`   ❌ ${img.file} 없음`);
      continue;
    }

    console.log(`\n   ${i+1}/${images.length} ${img.label} (${img.file})`);

    // Scroll editor to end to make room
    await editorPage.evaluate(() => {
      try {
        const ed = SmartEditor._editors['blogpc001'];
        if (ed._canvasScrollingService) ed._canvasScrollingService.scrollToBottom();
      } catch(e) {}
    });
    await editorPage.waitForTimeout(500);

    // Press Enter at the end to add a new paragraph
    await editorPage.keyboard.press('End');
    await editorPage.waitForTimeout(300);
    await editorPage.keyboard.press('Enter');
    await editorPage.waitForTimeout(500);

    // Click the "사진" button and wait for filechooser
    const [fileChooser] = await Promise.all([
      editorPage.waitForEvent('filechooser', { timeout: 10000 }).catch(() => null),
      editorPage.evaluate(() => {
        // Find the 사진 button
        const btns = document.querySelectorAll('button');
        for (const btn of btns) {
          if (btn.textContent.trim().includes('사진') && btn.offsetParent !== null) {
            btn.click();
            return 'clicked';
          }
        }
        // Try SE class
        const toolBtn = document.querySelector('.se-image-toolbar-button button');
        if (toolBtn) { toolBtn.click(); return 'clicked se'; }
        return 'not found';
      })
    ]);

    if (fileChooser) {
      console.log(`     📁 FileChooser 열림, 파일 업로드 중...`);
      await fileChooser.setFiles([imgPath]);
      console.log(`     ✅ 파일 선택 완료. SE4 처리 대기 중...`);

      // IMPORTANT: Wait a long time for SE4 to process and insert the image
      await editorPage.waitForTimeout(12000);
      console.log(`     ✅ 처리 완료`);
    } else {
      console.log(`     ⚠️ FileChooser 미발생`);
    }
  }

  // Step 3: Check document after uploads
  console.log('\n[3] 업로드 후 문서 상태...');
  await editorPage.waitForTimeout(3000);

  const afterState = await editorPage.evaluate(() => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      const body = ed._document.getBody();
      let imgCount = 0;
      let totalComps = 0;
      let comps = [];
      if (body && body.getChildren) {
        const children = body.getChildren();
        totalComps = children.length;
        comps = Array.from(children).slice(0, 30).map((c, i) => {
          const type = c['@ctype'] || c.type || c.constructor?.name || '?';
          let text = '';
          try { text = (c.innerText || '').substring(0, 30); } catch(e) {}
          if (type.toLowerCase().includes('image') || type.toLowerCase().includes('img')) imgCount++;
          return { idx: i, ctype: type, text };
        });
      }
      return { imgCount, totalComps, comps };
    } catch(e) {
      return { error: e.message };
    }
  });
  console.log(`   이미지: ${afterState.imgCount}장, 전체 컴포넌트: ${afterState.totalComps}`);
  console.log(`   컴포넌트 목록 (처음 30개):`);
  afterState.comps?.forEach(c => console.log(`     [${c.idx}] ${c.ctype} - ${c.text}`));

  // Step 4: Save via 발행 button
  console.log('\n[4] 저장...');
  const saveBtn = await editorPage.$('button.publish_btn__m9KHH');
  if (saveBtn) {
    console.log('   ✅ 발행 버튼 발견 (publish_btn)');
    await saveBtn.click();
    console.log('   ✅ 발행 버튼 클릭됨');
    await editorPage.waitForTimeout(5000);
    console.log(`   저장 후 URL: ${editorPage.url()}`);
  } else {
    console.log('   ⚠️ publish_btn not found. 다른 방법 시도...');
    const saveResult = await editorPage.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        if (btn.textContent.trim() === '발행' && btn.offsetParent !== null) {
          btn.click();
          return 'clicked: ' + btn.className;
        }
      }
      return 'not found';
    });
    console.log(`   ${saveResult}`);
    await editorPage.waitForTimeout(5000);
  }

  // Step 5: Verify
  console.log('\n[5] 최종 확인...');
  console.log(`   URL: ${editorPage.url()}`);
  console.log(`   제목: ${await editorPage.title().catch(() => 'N/A')}`);

  // Check final document
  if (editorPage.url().includes('postupdate')) {
    // Still on editor - check state
    const finalState = await editorPage.evaluate(() => {
      try {
        const ed = SmartEditor._editors['blogpc001'];
        const body = ed._document.getBody();
        if (body && body.getChildren) {
          const children = body.getChildren();
          const imgCount = Array.from(children).filter(c => {
            const type = c['@ctype'] || '';
            return type.toLowerCase().includes('image');
          }).length;
          return { totalComps: children.length, imgCount };
        }
        return { error: 'no body' };
      } catch(e) {
        return { error: e.message };
      }
    });
    console.log(`   문서 상태: ${JSON.stringify(finalState)}`);
  }

  await b.close();
  console.log('\n✅ 작업 완료');
})().catch(e => {
  console.error('❌ 오류:', e.message);
  process.exit(1);
});
