const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const path = require('path');
const WORKSPACE = 'C:\\Users\\paul\\.openclaw\\workspace';
const CARDS = ['aicut_card_reels_01.png','aicut_card_reels_02.png','aicut_card_reels_03.png','aicut_card_reels_04.png'];

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  
  let igPage = null;
  for (const p of pages) {
    if (p.url().includes('instagram.com/aicut')) { igPage = p; break; }
  }
  if (!igPage) { console.log('No IG page'); process.exit(1); }
  
  await igPage.bringToFront();
  await igPage.waitForTimeout(2000);
  
  // Check current page state
  const state = await igPage.evaluate(() => {
    const input = document.querySelector('input[type="file"]');
    if (input) {
      return {
        hasInput: true,
        accept: input.accept,
        multiple: input.multiple,
        hidden: input.offsetHeight === 0,
        parent: input.parentElement?.className?.substring(0,40) || ''
      };
    }
    return { hasInput: false, text: document.body.innerText.substring(0, 200) };
  });
  console.log('Current state:', JSON.stringify(state, null, 2));
  
  // If create modal is still open, set multiple=true and upload all 4
  if (state.hasInput) {
    console.log('File input exists, setting multiple=true and uploading 4 cards');
    
    const result = await igPage.evaluate(() => {
      const input = document.querySelector('input[type="file"]');
      input.multiple = true;
      return 'multiple set to true';
    });
    console.log(result);
    
    // Now try uploading all 4 files
    try {
      const filePaths = CARDS.map(f => path.join(WORKSPACE, f));
      await igPage.locator('input[type="file"]').first().setInputFiles(filePaths);
      console.log('✅ 4장 업로드 완료!');
    } catch(e) {
      console.log('4장 업로드 실패:', e.message);
    }
    
    await igPage.waitForTimeout(3000);
    
    // Navigate through screens
    // Click "다음"
    try {
      const nextBtn = igPage.locator('div[role="button"]').filter({ hasText: '다음' }).first();
      if (await nextBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nextBtn.click();
        console.log('✅ 다음 클릭');
        await igPage.waitForTimeout(2000);
      }
    } catch(e) { console.log('다음 실패:', e.message); }
    
    await igPage.screenshot({ path: 'ig_4cards_step1.png' });
    
    // Second "다음" 
    try {
      const nextBtn2 = igPage.locator('div[role="button"]').filter({ hasText: '다음' }).first();
      if (await nextBtn2.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nextBtn2.click();
        console.log('✅ 다음(2) 클릭');
        await igPage.waitForTimeout(2000);
      }
    } catch(e) { console.log('다음(2) 실패:', e.message); }
    
    await igPage.screenshot({ path: 'ig_4cards_caption.png' });
    
    // Paste caption
    const caption = `릴스 조회수, 3일 만든 영상보다 3시간 만든 영상이 더 잘 나가는 이유 🎬

3일 동안 기획·촬영·편집한 릴스 = 조회수 200
대충 찍고 간단 편집한 릴스 = 조회수 2.3만

차이가 100배... 왜 이런 일이 발생할까요?

📌 릴스 알고리즘의 핵심
1️⃣ 처음 3초 (체류율) - 시청자 멈추게 하기
2️⃣ 다시보기 2회 이상 = 가중치 UP
3️⃣ 공유/저장 = 바이럴 핵심
4️⃣ 댓글/좋아요 = 참여 신호

편집 퀄리티보다 메시지와 트렌드가 10배 더 중요합니다.
에이컷은 메시지를 해치지 않는 선에서 깔끔하게 편집해드려요.

👉 무료 상담: aicut.co.kr
#릴스마케팅 #숏폼마케팅 #릴스조회수 #인스타릴스 #숏폼제작 #릴스편집 #릴스 #인스타마케팅 #영상편집 #릴스노하우 #숏폼영상 #릴스광고 #콘텐츠마케팅 #마케팅 #영상편집외주 #영상편집대행 #릴스제작 #에이컷 #aicuts #숏폼콘텐츠 #영상제작 #숏폼에디터 #릴스전문 #영상편집서비스`;

    await igPage.evaluate((t) => navigator.clipboard.writeText(t), caption);
    await igPage.waitForTimeout(500);
    await igPage.keyboard.press('Control+v');
    await igPage.waitForTimeout(2000);
    console.log('✅ 캡션 붙여넣기 완료');
    
    // Share
    try {
      const shareBtn = igPage.locator('div[role="button"]').filter({ hasText: '공유' }).first();
      if (await shareBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await shareBtn.click();
        await igPage.waitForTimeout(5000);
        console.log('✅ 공유 완료!');
      }
    } catch(e) { console.log('공유 실패:', e.message); }
    
    await igPage.screenshot({ path: 'ig_4cards_done.png' });
    console.log('\n🎉 작업 완료!');
  } else {
    console.log('No file input - modal might be closed. Opening new post...');
    // Create new post from scratch
    // Click "새로운 게시물"
    await igPage.evaluate(() => {
      const svgs = document.querySelectorAll('svg');
      for (const svg of svgs) {
        if (svg.getAttribute('aria-label') === '새로운 게시물') {
          svg.closest('[role="button"]')?.click();
          break;
        }
      }
    });
    await igPage.waitForTimeout(3000);
    
    // Set multiple and upload
    const multiResult = await igPage.evaluate(() => {
      const input = document.querySelector('input[type="file"]');
      if (input) {
        input.multiple = true;
        return 'multiple set';
      }
      return 'no input';
    });
    console.log(multiResult);
    
    await igPage.waitForTimeout(500);
    
    try {
      const filePaths = CARDS.map(f => path.join(WORKSPACE, f));
      await igPage.locator('input[type="file"]').first().setInputFiles(filePaths);
      console.log('✅ 4장 업로드 완료!');
      await igPage.waitForTimeout(3000);
      await igPage.screenshot({ path: 'ig_4cards_uploaded.png' });
    } catch(e) {
      console.log('업로드 실패:', e.message);
      await igPage.screenshot({ path: 'ig_4cards_fail.png' });
    }
  }
  
  await browser.close();
})();
