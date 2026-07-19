const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();

  let targetPage = null;
  for (const p of pages) {
    if (p.url().includes('PostWriteForm') || p.url().includes('Redirect=Write')) {
      targetPage = p;
      break;
    }
  }
  if (!targetPage) {
    console.log('❌ 에디터 페이지 없음');
    return;
  }

  const frames = targetPage.frames();
  let editorFrame = null;
  for (const f of frames) {
    try {
      if (await f.evaluate(() => typeof SmartEditor !== 'undefined')) {
        editorFrame = f;
        break;
      }
    } catch(e) {}
  }
  if (!editorFrame) {
    console.log('❌ SmartEditor 없음');
    return;
  }

  console.log('✅ 에디터 발견, 이미지 업로드 시작...\n');

  const imageFiles = [
    'aicut_blog_main.png',
    'aicut_blog_card1.png',
    'aicut_blog_card2.png',
    'aicut_blog_card3.png',
    'aicut_blog_cta.png'
  ];

  // 방법: main page에서 filechooser 대기
  for (let i = 0; i < imageFiles.length; i++) {
    const imgPath = path.join(__dirname, imageFiles[i]);
    console.log(`${i+1}. ${imageFiles[i]} 업로드 중...`);

    // 사진 버튼 클릭
    const btn = await editorFrame.$('button:has-text("사진")');
    if (!btn) {
      console.log('   사진 버튼 없음');
      continue;
    }

    try {
      // filechooser 대기 (main page)
      const [fileChooser] = await Promise.all([
        targetPage.waitForEvent('filechooser', { timeout: 8000 }),
        btn.click()
      ]);
      
      await fileChooser.setFiles([imgPath]);
      console.log(`   ✅ ${imageFiles[i]} 업로드 완료 (${Math.round(fs.statSync(imgPath).size / 1024)}KB)`);
      await targetPage.waitForTimeout(6000);
      
    } catch(e) {
      console.log(`   ❌ 실패: ${e.message}`);
      
      // 대안: 상위 window의 input 찾기
      try {
        const hiddenInput = await targetPage.$('input[type="file"]');
        if (hiddenInput) {
          console.log('   → hidden input 발견, 직접 설정 시도');
          await hiddenInput.setInputFiles([imgPath]);
          console.log('   ✅ 직접 설정 완료');
          await targetPage.waitForTimeout(6000);
          continue;
        }
      } catch(e2) {
        console.log(`   → fallback 실패: ${e2.message}`);
      }
    }
  }

  // 이미지 정렬
  console.log('\n이미지 정렬 center 설정...');
  await editorFrame.evaluate(() => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      const data = ed.getDocumentData();
      if (data?.document?.blocks) {
        data.document.blocks.forEach(b => {
          if (b.type === 'image') b.align = 'center';
        });
        ed.setDocumentData(data);
      }
    } catch(e) {}
  });

  // 저장
  await editorFrame.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.innerText.trim() === '저장') { btn.click(); break; }
    }
  });

  console.log('\n✅ 완료! 브라우저 확인해주세요.');
})();
