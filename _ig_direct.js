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
  if (!igPage) { console.log('IG page not found'); process.exit(1); }
  
  await igPage.bringToFront();
  await igPage.waitForTimeout(2000);
  
  // Try using setInputFiles directly on the hidden input (PNG accept)
  const inputs = igPage.locator('input[type="file"]');
  const count = await inputs.count();
  console.log('File inputs:', count);
  
  if (count > 0) {
    // Second input accepts image/png too - try that one
    const input2 = inputs.nth(1);
    
    // Set files directly without waiting for filechooser
    try {
      await input2.setInputFiles([
        path.join(WORKSPACE, CARDS[0]),
        path.join(WORKSPACE, CARDS[1]),
        path.join(WORKSPACE, CARDS[2]),
        path.join(WORKSPACE, CARDS[3])
      ]);
      console.log('✅ 4장 파일 설정 완료!');
    } catch(e) {
      console.log('4장 실패:', e.message);
      // Try one at a time
      try {
        await input2.setInputFiles([path.join(WORKSPACE, CARDS[0])]);
        console.log('✅ 1장 설정 완료');
        
        await igPage.waitForTimeout(3000);
        await igPage.screenshot({ path: 'ig_1card.png' });
        
        // Click next
        const nextBtn = igPage.locator('div[role="button"]').filter({ hasText: '다음' }).first();
        if (await nextBtn.isVisible()) {
          await nextBtn.click();
          await igPage.waitForTimeout(2000);
          console.log('Clicked 다음');
        }
        
        await igPage.screenshot({ path: 'ig_1card_filter.png' });
        
        // Write caption
        const caption = `릴스 조회수, 3일 만든 영상보다 3시간 만든 영상이 더 잘 나가는 이유 🎬
        
3일 동안 기획·촬영·편집한 릴스 = 조회수 200
대충 찍고 간단 편집한 릴스 = 조회수 2.3만

차이가 100배... 왜 이런 일이 발생할까요?

📌 릴스 알고리즘의 핵심
① 처음 3초 (체류율)
② 다시보기 2회+ (가중치 UP)
③ 공유/저장 (바이럴 핵심)
④ 댓글/좋아요 (참여 신호)

👉 무료 상담: aicut.co.kr
#릴스마케팅 #숏폼마케팅 #릴스조회수 #인스타릴스 #숏폼제작 #릴스편집 #릴스 #인스타마케팅 #영상편집 #릴스노하우 #숏폼영상 #릴스광고 #콘텐츠마케팅 #마케팅 #영상편집외주 #영상편집대행 #릴스제작 #에이컷 #aicuts #숏폼콘텐츠 #영상제작 #숏폼에디터 #릴스전문 #영상편집서비스`;
        
        await igPage.evaluate((t) => navigator.clipboard.writeText(t), caption);
        await igPage.waitForTimeout(500);
        await igPage.keyboard.press('Control+v');
        await igPage.waitForTimeout(2000);
        console.log('캡션 붙여넣기 완료');
        
        await igPage.screenshot({ path: 'ig_caption_ready.png' });
        
        console.log('\n✅ 업로드 준비 완료! 공유 버튼을 눌러주세요.');
        
      } catch(e2) {
        console.log('1장도 실패:', e2.message);
        await igPage.screenshot({ path: 'ig_fail.png' });
      }
    }
  } else {
    console.log('No file inputs found');
    await igPage.screenshot({ path: 'ig_no_input.png' });
  }
  
  await browser.close();
})();
