const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = ctx.pages()[0] || await ctx.newPage();
  page.on('dialog', async d => d.dismiss());

  // 블로그 글쓰기 페이지 열기
  console.log('1. SE4 에디터 열기...');
  await page.goto('https://blog.naver.com/PostEditor.naver?blogId=aicut', {
    waitUntil: 'domcontentloaded', timeout: 20000
  });
  await page.waitForTimeout(5000);

  const url = page.url();
  console.log(`URL: ${url}`);

  if (url.includes('nid.naver.com') || url.includes('login')) {
    console.log('❌ 로그인 필요 — 수동 로그인이 필요합니다');
    return;
  }

  // 제목 설정
  console.log('2. 제목 설정...');
  await page.evaluate(() => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      ed.setDocumentTitle('제헌절 7월, 서울 가족·연인 데이트 코스 BEST 5');
      return '제목 설정 성공: ' + ed.getTitle();
    } catch (e) {
      return '제목 설정 실패: ' + e.message;
    }
  });

  // 본문 내용 읽기
  const htmlContent = fs.readFileSync(path.join(__dirname, 'blog_content_20260717.html'), 'utf-8');
  
  // setDocumentData 방식으로 본문 입력
  console.log('3. 본문 입력 시도...');
  
  // HTML에서 텍스트 블록 추출 (간단한 방식)
  const blocks = [];
  const pRegex = /<p[^>]*>([^<]*)<\/p>/g;
  let m;
  while ((m = pRegex.exec(htmlContent)) !== null) {
    const text = m[1].trim().replace(/<strong>/g, '').replace(/<\/strong>/g, '');
    if (text.length > 0) {
      blocks.push({ type: 'paragraph', text, style: { textAlign: 'center' } });
    }
  }
  
  // H2/H3 추출
  const hRegex = /<h([23])[^>]*>([^<]*)<\/h[23]>/g;
  while ((m = hRegex.exec(htmlContent)) !== null) {
    const text = m[2].trim().replace(/<strong>/g, '').replace(/<\/strong>/g, '');
    if (text.length > 0) {
      blocks.push({ type: 'heading' + m[1], text, style: { textAlign: 'center' } });
    }
  }

  console.log(`  총 ${blocks.length}개 블록 추출됨`);

  // setDocumentData 실행
  const result = await page.evaluate((blocks) => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      const data = ed.getDocumentData();
      data.document.blocks = blocks;
      ed.setDocumentData(data);
      
      // canvas 직접 업데이트
      const canvas = document.querySelector('.se-canvas');
      if (canvas) {
        let html = '';
        for (const b of blocks) {
          if (b.type.startsWith('heading')) {
            html += `<h${b.type.slice(-1)} style="text-align:center">${b.text}</h${b.type.slice(-1)}>`;
          } else {
            html += `<p style="text-align:center">${b.text}</p>`;
          }
          html += '<br>';
        }
        canvas.innerHTML = html;
        canvas.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
        return '✅ 본문 입력 성공 (' + blocks.length + '개 블록)';
      }
      return '⚠️ canvas 요소 없음';
    } catch (e) {
      return '❌ 오류: ' + e.message;
    }
  }, blocks);
  
  console.log('  결과:', result);

  // 본문이 실제로 입력되었는지 확인
  await page.waitForTimeout(2000);
  const textLen = await page.evaluate(() => {
    try {
      return SmartEditor._editors['blogpc001'].getContentText().length;
    } catch (e) {
      return -1;
    }
  });
  console.log(`  본문 길이 확인: ${textLen}자`);

  // 이미지 업로드 (첫번째 이미지 - 대표)
  console.log('4. 이미지 업로드...');
  
  // 사진 버튼 찾기
  const imageBtn = await page.$('.se-image-toolbar-button, [class*="image-toolbar"], [class*="imageToolbar"]');
  if (imageBtn) {
    console.log('  사진 버튼 찾음, 클릭 시도...');
    
    // 파일 선택을 위한 FileChooser 대기
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null),
      imageBtn.click().catch(() => {})
    ]);
    
    if (fileChooser) {
      const imgPath = path.join(__dirname, 'aicut_blog_main.png');
      await fileChooser.setFiles([imgPath]);
      console.log('  ✅ 대표 이미지 업로드 완료 (aicut_blog_main.png)');
      await page.waitForTimeout(6000);
    } else {
      console.log('  ⚠️ FileChooser 이벤트 없음, input 직접 시도');
    }
  } else {
    console.log('  ⚠️ 사진 버튼을 찾을 수 없음');
  }

  // 저장 버튼 찾기
  console.log('5. 저장 버튼 찾기...');
  const saveResult = await page.evaluate(() => {
    const btns = document.querySelectorAll('button, a, [role="button"], .se-editor-save, [class*="save"]');
    for (const btn of btns) {
      if (btn.innerText.includes('저장')) {
        btn.click();
        return '저장 버튼 클릭됨: ' + btn.innerText;
      }
    }
    return '저장 버튼 못 찾음';
  });
  console.log('  결과:', saveResult);
  
  await page.waitForTimeout(3000);

  console.log('\n✅ SE4 자동화 완료');
  console.log('   발행 전, 정이사님께 저장 확인 후 승인 대기 필요');
})();
