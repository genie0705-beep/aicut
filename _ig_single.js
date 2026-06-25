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
  if (!igPage) { process.exit(1); }
  
  await igPage.bringToFront();
  await igPage.waitForTimeout(2000);
  
  // Check file inputs with multiple attribute
  const info = await igPage.evaluate(() => {
    return Array.from(document.querySelectorAll('input[type="file"]')).map(i => ({
      accept: i.accept, multiple: i.multiple, hidden: i.offsetHeight===0
    }));
  });
  console.log('File inputs:', JSON.stringify(info));
  
  // Upload one file first
  const fcPromise = igPage.waitForEvent('filechooser', { timeout: 10000 });
  await igPage.locator('input[type="file"]').first().click();
  const fc = await fcPromise.catch(() => null);
  
  if (fc) {
    await fc.setFiles(path.join(WORKSPACE, CARDS[0]));
    console.log('✅ 1장 업로드');
    await igPage.waitForTimeout(3000);
    
    // Navigate to next screen
    await igPage.screenshot({ path: 'ig_step1.png' });
    
    // Try clicking next
    const nextBtn = await igPage.getByRole('button', { name: '다음' }).first();
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await igPage.waitForTimeout(2000);
      console.log('Clicked 다음');
    }
    
    await igPage.screenshot({ path: 'ig_step2.png' });
    
    // Second next
    const nextBtn2 = await igPage.getByRole('button', { name: '다음' }).first();
    if (await nextBtn2.isVisible()) {
      await nextBtn2.click();
      await igPage.waitForTimeout(2000);
      console.log('Clicked 다음 (2)');
    }
    
    await igPage.screenshot({ path: 'ig_step3.png' });
    
    // Paste caption
    const caption = `릴스 조회수, 3일 만든 영상보다 3시간 만든 영상이 더 잘 나가는 이유 🎬

3일 동안 기획·촬영·편집한 릴스 = 조회수 200
대충 찍고 간단 편집한 릴스 = 조회수 2.3만

차이가 100배... 왜 이런 일이 발생할까요?

📌 릴스 알고리즘의 핵심
1️⃣ 처음 3초 안에 시청자 멈추게 하기
2️⃣ 다시보기 2회 이상 = 가중치 UP
3️⃣ 공유/저장 = 바이럴 핵심
4️⃣ 댓글/좋아요 = 참여 신호

편질 퀄리티보다 메시지가 10배 더 중요합니다.
에이컷은 메시지를 해치지 않는 선에서 깔끔하게 편집해드려요.

👉 무료 상담: aicut.co.kr
#릴스마케팅 #숏폼마케팅 #릴스조회수 #인스타릴스 #숏폼제작 #릴스편집 #릴스 #인스타마케팅 #영상편집 #릴스노하우 #숏폼영상 #릴스광고 #콘텐츠마케팅 #마케팅 #영상편집외주 #영상편집대행 #릴스제작 #에이컷 #aicuts #숏폼콘텐츠 #영상제작 #숏폼에디터 #릴스전문 #영상편집서비스`;

    await igPage.evaluate((t) => navigator.clipboard.writeText(t), caption);
    await igPage.waitForTimeout(500);
    await igPage.keyboard.press('Control+v');
    await igPage.waitForTimeout(2000);
    console.log('캡션 붙여넣기 완료');
    
    await igPage.screenshot({ path: 'ig_caption.png' });
    
    console.log('\n=== 📸 업로드 준비 완료 ===');
    console.log('공유 버튼을 누르면 발행됩니다.');
    console.log('(자동 클릭 시도 가능)');
    
    // Try to share
    try {
      const shareBtn = igPage.getByRole('button', { name: '공유' });
      if (await shareBtn.isVisible()) {
        await shareBtn.click();
        await igPage.waitForTimeout(5000);
        console.log('✅ 공유 버튼 클릭!');
        await igPage.screenshot({ path: 'ig_shared.png' });
      }
    } catch(e) {
      console.log('공유 버튼 클릭 실패 (직접 눌러주세요)');
    }
  } else {
    console.log('❌ filechooser 없음');
  }
  
  await browser.close();
})();
