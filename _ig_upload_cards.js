const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const path = require('path');
const fs = require('fs');

const WORKSPACE = 'C:\\Users\\paul\\.openclaw\\workspace';

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  
  // Find Instagram tab
  let igPage = null;
  for (const p of pages) {
    if (p.url().includes('instagram.com/aicut')) {
      igPage = p;
      break;
    }
  }
  
  if (!igPage) {
    // Open Instagram
    igPage = await ctx.newPage();
    await igPage.goto('https://www.instagram.com/', { waitUntil: 'networkidle', timeout: 30000 });
    await igPage.waitForTimeout(3000);
  }
  
  await igPage.bringToFront();
  
  // Check if logged in
  const url = igPage.url();
  console.log('IG URL:', url);
  
  if (url.includes('accounts/login') || url.includes('login')) {
    console.log('❌ Instagram 로그인 필요');
    await browser.close();
    return;
  }
  
  console.log('✅ Instagram 로그인됨');
  
  // Navigate to profile / upload page
  // Instagram web upload: click the + button in the top bar
  
  // Let's check the existing cards first
  console.log('\n=== 기존 카드뉴스 ===');
  const reelsCards = ['aicut_card_reels_01.png', 'aicut_card_reels_02.png', 'aicut_card_reels_03.png', 'aicut_card_reels_04.png'];
  for (const card of reelsCards) {
    const p = path.join(WORKSPACE, card);
    console.log(card, fs.existsSync(p) ? '✅' : '❌ 없음');
  }
  
  // Navigate to upload
  console.log('\n=== 인스타 업로드 ===');
  await igPage.goto('https://www.instagram.com/', { waitUntil: 'networkidle', timeout: 30000 });
  await igPage.waitForTimeout(3000);
  
  // Click the create (+) button
  // The button is usually at the top navigation
  const createBtn = await igPage.$('svg[aria-label="새 게시물"], svg[aria-label="New post"], [class*="create"]');
  if (createBtn) {
    await createBtn.click();
    console.log('✅ + 버튼 클릭');
    await igPage.waitForTimeout(2000);
    
    // Wait for file chooser
    const fileChooserPromise = igPage.waitForEvent('filechooser', { timeout: 10000 });
    
    // Click "컴퓨터에서 선택" or similar
    const selectBtn = await igPage.$('button:has-text("컴퓨터에서"), button:has-text("Select from"), [class*="select"]');
    if (selectBtn) {
      await selectBtn.click();
    }
    
    const fileChooser = await fileChooserPromise.catch(() => null);
    if (fileChooser) {
      // Upload all 4 card images
      const filePaths = reelsCards.map(f => path.join(WORKSPACE, f));
      await fileChooser.setFiles(filePaths);
      console.log('✅ 이미지 4장 선택 완료');
      await igPage.waitForTimeout(3000);
      
      // Click next/arrow
      await igPage.screenshot({ path: 'ig_upload_step1.png' });
      
      // Next button
      const nextBtn = await igPage.$('div[role="button"]:has-text("다음"), button:has-text("Next"), div:has-text("다음")');
      if (nextBtn) {
        await nextBtn.click();
        await igPage.waitForTimeout(2000);
        console.log('✅ 다음 버튼 클릭');
      }
      
      await igPage.screenshot({ path: 'ig_upload_step2.png' });
      
      console.log('\n=== ✅ 업로드 진행 중 ===');
    } else {
      console.log('❌ 파일 선택기 없음');
      await igPage.screenshot({ path: 'ig_upload_fail.png' });
    }
  } else {
    console.log('❌ + 버튼 찾을 수 없음');
    await igPage.screenshot({ path: 'ig_no_create_btn.png' });
  }
  
  await browser.close();
})();
