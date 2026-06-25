const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const path = require('path');
const fs = require('fs');

const WORKSPACE = 'C:\\Users\\paul\\.openclaw\\workspace';
const IMG_DIR = WORKSPACE;

const IMAGE_FILES = [
  path.join(IMG_DIR, 'aicut_blog_freelancer_thumb.png'),
  path.join(IMG_DIR, 'aicut_blog_freelancer_01.png'),
  path.join(IMG_DIR, 'aicut_blog_freelancer_02.png'),
  path.join(IMG_DIR, 'aicut_blog_freelancer_03.png'),
  path.join(IMG_DIR, 'aicut_blog_freelancer_cta.png'),
];

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  
  // 1. Open blog editor
  console.log('=== 에디터 열기 ===');
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);
  console.log('URL:', page.url());
  
  // Take a screenshot of the editor
  await page.screenshot({ path: path.join(WORKSPACE, 'editor_state.png'), fullPage: true });
  
  // 2. Set title - find the title input
  console.log('\n=== 제목 입력 ===');
  const titleInput = await page.$('input[placeholder*="제목"], input#title, input.title, [contenteditable].title, .title-area input, [class*="title"] input');
  if (titleInput) {
    await titleInput.click();
    await titleInput.fill('영상편집 클린트 5번, 수정 요청 30회... 프리랜서 편집러와 작별한 이유');
    console.log('✅ 제목 입력 완료 (input)');
  } else {
    // Try the SmartEditor API
    try {
      await page.evaluate(() => {
        if (typeof SmartEditor !== 'undefined' && SmartEditor._editors) {
          const editor = Object.values(SmartEditor._editors)[0];
          if (editor && editor.setDocumentTitle) {
            editor.setDocumentTitle('영상편집 클린트 5번, 수정 요청 30회... 프리랜서 편집러와 작별한 이유');
            return true;
          }
        }
        return false;
      });
      console.log('✅ 제목 입력 완료 (SmartEditor API)');
    } catch(e) {
      console.log('❌ 제목 입력 실패:', e.message);
    }
  }
  await page.waitForTimeout(1000);
  
  // 3. Upload images via filechooser
  console.log('\n=== 이미지 업로드 ===');
  
  for (let i = 0; i < IMAGE_FILES.length; i++) {
    const imgPath = IMAGE_FILES[i];
    const imgName = path.basename(imgPath);
    console.log(`이미지 ${i+1}/${IMAGE_FILES.length}: ${imgName}`);
    
    // Check if file exists
    if (!fs.existsSync(imgPath)) {
      console.log(`  ⚠️ 파일 없음: ${imgPath}`);
      continue;
    }
    
    // Find the photo button
    const photoBtn = await page.evaluate(() => {
      // Look for "사진" or "사진 추가" button
      const allBtns = document.querySelectorAll('button, [role="button"], a');
      for (const btn of allBtns) {
        const text = (btn.innerText || '').trim();
        if (text === '사진' || text === '사진 추가') {
          const rect = btn.getBoundingClientRect();
          return { x: rect.x + rect.width/2, y: rect.y + rect.height/2, found: true };
        }
      }
      return { found: false };
    });
    
    if (photoBtn.found) {
      console.log(`  사진 버튼 위치: (${photoBtn.x}, ${photoBtn.y})`);
      
      // Set up file chooser first, then click
      const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 15000 }).catch(e => null);
      await page.mouse.click(photoBtn.x, photoBtn.y);
      
      const fc = await fileChooserPromise;
      if (fc) {
        await fc.setFiles(imgPath);
        console.log(`  ✅ ${imgName} 업로드 완료`);
        await page.waitForTimeout(2000);
      } else {
        console.log(`  ❌ 파일 선택기 응답 없음`);
        // Take screenshot of current state
        await page.screenshot({ path: path.join(WORKSPACE, `img_fail_${i}.png`) });
      }
    } else {
      console.log(`  ❌ 사진 버튼을 찾을 수 없음`);
      // Take screenshot to debug
      await page.screenshot({ path: path.join(WORKSPACE, `debug_no_photo_btn.png`) });
    }
  }
  
  // 4. Take final screenshot
  await page.screenshot({ path: path.join(WORKSPACE, 'blog_after_images.png'), fullPage: true });
  
  console.log('\n=== 완료 ===');
  console.log('제목, 이미지 처리 상태 확인: blog_after_images.png');
  console.log('저장 또는 발행 버튼이 보이면 정이사님이 직접 클릭 필요');
  
  await browser.close();
})();
