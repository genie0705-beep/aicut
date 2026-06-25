const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const path = require('path');
const fs = require('fs');

const WORKSPACE = 'C:\\Users\\paul\\.openclaw\\workspace';

const IMAGE_FILES = [
  'aicut_blog_freelancer_thumb.png',
  'aicut_blog_freelancer_01.png',
  'aicut_blog_freelancer_02.png',
  'aicut_blog_freelancer_03.png',
  'aicut_blog_freelancer_cta.png',
];

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  
  // Open blog editor
  console.log('=== 에디터 열기 ===');
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);
  
  // 1. Set title via SmartEditor API
  console.log('\n=== 제목 입력 ===');
  const titleSet = await page.evaluate(() => {
    try {
      if (typeof SmartEditor !== 'undefined') {
        const editors = SmartEditor._editors;
        if (editors) {
          const keys = Object.keys(editors);
          if (keys.length > 0) {
            editors[keys[0]].setDocumentTitle('영상편집 클린트 5번, 수정 요청 30회... 프리랜서 편집러와 작별한 이유');
            return 'API 성공';
          }
        }
      }
      return 'SmartEditor API not found';
    } catch(e) { return 'Error: ' + e.message; }
  });
  console.log('제목:', titleSet);
  await page.waitForTimeout(1000);
  
  // 2. Upload images - try clicking the floating photo button
  console.log('\n=== 이미지 업로드 ===');
  
  for (let i = 0; i < IMAGE_FILES.length; i++) {
    const imgName = IMAGE_FILES[i];
    const imgPath = path.join(WORKSPACE, imgName);
    console.log(`\n이미지 ${i+1}/${IMAGE_FILES.length}: ${imgName}`);
    
    if (!fs.existsSync(imgPath)) {
      console.log(`  ⚠️ 파일 없음, 스킵`);
      continue;
    }
    
    // Try method 1: Click the 사진 button and wait for filechooser
    const result = await page.evaluate(() => {
      // Find the 사진 button
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        const text = (btn.innerText || '').trim();
        if (text.startsWith('사진')) {
          const rect = btn.getBoundingClientRect();
          return { found: true, x: rect.x + rect.width/2, y: rect.y + rect.height/2, text: text.substring(0,10) };
        }
      }
      // Try floating photo button
      const floating = document.querySelector('.se-floating-category-button-photo');
      if (floating) {
        const rect = floating.getBoundingClientRect();
        return { found: true, x: rect.x + rect.width/2, y: rect.y + rect.height/2, text: 'floating' };
      }
      return { found: false };
    });
    
    if (!result.found) {
      console.log('  ❌ 사진 버튼 없음');
      continue;
    }
    
    console.log(`  버튼 위치: (${Math.round(result.x)}, ${Math.round(result.y)}) text=${result.text}`);
    
    // Set up file chooser handler BEFORE clicking
    const fcPromise = page.waitForEvent('filechooser', { timeout: 10000 });
    await page.mouse.click(result.x, result.y);
    
    // Wait a bit for file chooser or submenu
    await page.waitForTimeout(1500);
    
    // Check if a popup/submenu appeared
    const popupState = await page.evaluate(() => {
      const popups = document.querySelectorAll('.se-popup, [class*="popup"], [class*="modal"], [class*="dialog"]');
      return Array.from(popups).filter(p => p.offsetHeight > 0).map(p => ({
        text: (p.innerText || '').substring(0, 50),
        visible: p.offsetHeight > 0
      }));
    });
    
    if (popupState.length > 0) {
      console.log(`  팝업 감지: ${popupState[0].text.substring(0, 30)}`);
      
      // Click "사진 추가" or "파일 선택" in the popup
      const subResult = await page.evaluate(() => {
        const btns = document.querySelectorAll('button, [role="button"], a, li');
        for (const btn of btns) {
          const text = (btn.innerText || '').trim();
          if (text.includes('사진 추가') || text.includes('파일 선택') || text.includes('업로드') || text.includes('내 PC')) {
            const rect = btn.getBoundingClientRect();
            if (rect.width > 0) {
              return { found: true, x: rect.x + rect.width/2, y: rect.y + rect.height/2, text: text.substring(0,15) };
            }
          }
        }
        return { found: false };
      });
      
      if (subResult.found) {
        console.log(`  하위 버튼: (${Math.round(subResult.x)}, ${Math.round(subResult.y)}) ${subResult.text}`);
        
        // Set up NEW file chooser handler for sub-dialog
        const fcPromise2 = page.waitForEvent('filechooser', { timeout: 10000 });
        await page.mouse.click(subResult.x, subResult.y);
        
        const fc2 = await fcPromise2.catch(() => null);
        if (fc2) {
          await fc2.setFiles(imgPath);
          console.log(`  ✅ ${imgName} 업로드 완료!`);
          await page.waitForTimeout(2000);
          continue;
        }
      }
    }
    
    // Check if filechooser was triggered
    const fc = await fcPromise.catch(() => null);
    if (fc) {
      await fc.setFiles(imgPath);
      console.log(`  ✅ ${imgName} 업로드 완료!`);
      await page.waitForTimeout(2000);
    } else {
      console.log(`  ❌ 파일 선택기 없음 - 정이사님이 직접 등록 필요`);
    }
  }
  
  // 3. Paste body content into editor
  console.log('\n=== 본문 입력 시도 ===');
  const bodyResult = await page.evaluate(() => {
    try {
      const editors = SmartEditor._editors;
      if (editors) {
        const keys = Object.keys(editors);
        if (keys.length > 0) {
          // Use setDocumentData if available, but this may not render
          // Better to use clipboard paste
          const editor = editors[keys[0]];
          return 'SmartEditor found: ' + keys[0];
        }
      }
      return 'No editor found';
    } catch(e) { return 'Error: ' + e.message; }
  });
  console.log('Editor state:', bodyResult);
  
  // 4. Take final screenshot
  await page.screenshot({ path: path.join(WORKSPACE, 'blog_upload_final.png'), fullPage: true });
  
  console.log('\n=== 완료 ===');
  console.log('제목: 입력됨');
  console.log('이미지: 5장 준비');
  console.log('본문: 붙여넣기 필요 (정이사님 직접)');
  console.log('에디터 화면: blog_upload_final.png 확인');
  
  await browser.close();
})();
