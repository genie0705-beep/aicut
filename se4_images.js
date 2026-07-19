const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();

  // PostWriteForm 페이지 찾기
  let targetPage = null;
  for (const p of pages) {
    const url = p.url();
    if (url.includes('PostWriteForm') || url.includes('Redirect=Write')) {
      targetPage = p;
      break;
    }
  }

  if (!targetPage) {
    console.log('❌ 에디터 페이지 없음 — 새로 엽니다');
    const page = ctx.pages()[0] || await ctx.newPage();
    page.on('dialog', async d => d.dismiss());
    await page.goto('https://blog.naver.com/PostList.naver?blogId=aicut', {
      waitUntil: 'domcontentloaded', timeout: 15000
    });
    await page.waitForTimeout(3000);
    await page.evaluate(() => {
      const btn = document.querySelector('a[href*="Redirect=Write"]');
      if (btn) btn.click();
    });
    await page.waitForTimeout(5000);
    targetPage = page;
  }

  // iframe 찾기
  const frames = targetPage.frames();
  let editorFrame = null;
  for (const f of frames) {
    try {
      const hasSE = await f.evaluate(() => typeof SmartEditor !== 'undefined');
      if (hasSE) { editorFrame = f; break; }
    } catch(e) {}
  }

  if (!editorFrame) {
    console.log('❌ SmartEditor iframe 못 찾음');
    return;
  }

  console.log('✅ SmartEditor iframe 발견');

  // 1. 본문 맨 끝으로 커서 이동
  await editorFrame.evaluate(() => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      ed._canvasScrollingService.scrollToBottom();
    } catch(e) {}
  });

  // 2. 이미지 업로드 시도 (5장 순차)
  const imageFiles = [
    'aicut_blog_main.png',
    'aicut_blog_card1.png',
    'aicut_blog_card2.png',
    'aicut_blog_card3.png',
    'aicut_blog_cta.png'
  ];

  for (let i = 0; i < imageFiles.length; i++) {
    const imgFile = imageFiles[i];
    const imgPath = path.join(__dirname, imgFile);
    
    console.log(`\n${i+1}/${imageFiles.length} ${imgFile} 업로드 시도...`);

    // 사진 버튼 찾기
    const photoBtn = await editorFrame.$('button:has-text("사진"), button:has-text("사진 추가")');
    if (!photoBtn) {
      console.log(`   사진 버튼 없음`);
      continue;
    }

    // filechooser 이벤트 리스너 설정 후 클릭
    try {
      const [fileChooser] = await Promise.all([
        editorFrame.waitForEvent('filechooser', { timeout: 5000 }),
        photoBtn.click()
      ]);

      await fileChooser.setFiles([imgPath]);
      console.log(`   ✅ 파일 선택 완료 (${imgFile})`);
      
      // 업로드 대기
      await editorFrame.waitForTimeout(6000);
      
      // 업로드된 이미지 확인
      const imgCount = await editorFrame.evaluate(() => {
        return document.querySelectorAll('.se-image, .se-image-resource, img[class*="se-"], [class*="image-component"], [data-component*="image"]').length;
      });
      console.log(`   현재 이미지 개수: ${imgCount}`);
      
    } catch(e) {
      console.log(`   ❌ filechooser 실패: ${e.message}`);
      
      // fallback: 직접 input[type=file] 찾기
      try {
        const fileInput = await editorFrame.$('input[type="file"]');
        if (fileInput) {
          await fileInput.setInputFiles([imgPath]);
          console.log(`   ✅ input 직접 설정 완료`);
          await editorFrame.waitForTimeout(6000);
        } else {
          console.log(`   ⚠️ input[type=file]도 없음`);
        }
      } catch(e2) {
        console.log(`   ❌ fallback도 실패: ${e2.message}`);
      }
    }
  }

  // 3. 이미지 정렬 center 설정
  console.log('\n3. 이미지 정렬 center 설정...');
  const alignResult = await editorFrame.evaluate(() => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      const data = ed.getDocumentData();
      let imageCount = 0;
      
      if (data && data.document && data.document.blocks) {
        for (const block of data.document.blocks) {
          if (block.type === 'image') {
            block.align = 'center';
            imageCount++;
          }
        }
        ed.setDocumentData(data);
      }
      return { imageBlocks: imageCount };
    } catch(e) {
      return { error: e.message };
    }
  });
  console.log(`   ${JSON.stringify(alignResult)}`);

  // 4. 저장
  console.log('\n4. 저장...');
  await editorFrame.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.innerText.trim() === '저장') {
        btn.click();
        console.log('저장 클릭');
        return;
      }
    }
  });

  console.log('\n✅ 이미지 업로드 시도 완료!');
  console.log('브라우저 확인 부탁드립니다!');
})();
