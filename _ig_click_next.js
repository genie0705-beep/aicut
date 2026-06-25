const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const path = require('path');
const WORKSPACE = 'C:\\Users\\paul\\.openclaw\\workspace';

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  
  let igPage = null;
  for (const p of pages) {
    if (p.url().includes('instagram.com/aicut')) { igPage = p; break; }
  }
  if (!igPage) { console.log('No IG page'); await browser.close(); return; }
  
  await igPage.bringToFront();
  await igPage.waitForTimeout(2000);
  await igPage.screenshot({ path: 'ig_step0.png' });
  
  // Find ALL visible buttons and their positions
  const buttons = await igPage.evaluate(() => {
    const result = [];
    const all = document.querySelectorAll('div[role="button"], button, span[role="button"], a[role="button"]');
    all.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width > 10 && r.height > 10) {
        const text = (el.innerText || '').trim();
        const ariaLabel = el.getAttribute('aria-label') || '';
        if (text || ariaLabel) {
          result.push({
            text: text.substring(0, 30),
            ariaLabel: ariaLabel.substring(0, 30),
            x: Math.round(r.x + r.width/2),
            y: Math.round(r.y + r.height/2),
            w: Math.round(r.width),
            h: Math.round(r.height)
          });
        }
      }
    });
    return result;
  });
  
  console.log('=== 모든 버튼 ===');
  buttons.forEach(b => console.log(`  "${b.text}" (x:${b.x}, y:${b.y}, ${b.w}x${b.h}) aria:${b.ariaLabel}`));
  
  // Find "다음" button specifically
  const nextBtn = buttons.find(b => b.text === '다음' || b.ariaLabel === '다음');
  
  if (nextBtn) {
    console.log(`\n✅ "다음" 버튼 발견! 클릭합니다 (${nextBtn.x}, ${nextBtn.y})`);
    await igPage.mouse.click(nextBtn.x, nextBtn.y);
    await igPage.waitForTimeout(3000);
    await igPage.screenshot({ path: 'ig_step1_next.png' });
    
    // After clicking next, check for second "다음" or "공유"
    const buttons2 = await igPage.evaluate(() => {
      const result = [];
      const all = document.querySelectorAll('div[role="button"], button, span[role="button"], a[role="button"]');
      all.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.width > 10 && r.height > 10) {
          const text = (el.innerText || '').trim();
          const ariaLabel = el.getAttribute('aria-label') || '';
          if (text || ariaLabel) {
            result.push({
              text: text.substring(0, 30),
              x: Math.round(r.x + r.width/2),
              y: Math.round(r.y + r.height/2)
            });
          }
        }
      });
      return result;
    });
    
    console.log('\n=== 2nd 화면 버튼 ===');
    buttons2.forEach(b => console.log(`  "${b.text}" (${b.x}, ${b.y})`));
    
    // Find "다음" again (for filter screen)
    const nextBtn2 = buttons2.find(b => b.text === '다음');
    
    if (nextBtn2) {
      console.log(`\n✅ 두번째 "다음" 클릭 (${nextBtn2.x}, ${nextBtn2.y})`);
      await igPage.mouse.click(nextBtn2.x, nextBtn2.y);
      await igPage.waitForTimeout(3000);
      await igPage.screenshot({ path: 'ig_step2_next.png' });
      
      // Now on caption screen - check for "공유" button
      const buttons3 = await igPage.evaluate(() => {
        const result = [];
        const all = document.querySelectorAll('div[role="button"], button');
        all.forEach(el => {
          const r = el.getBoundingClientRect();
          if (r.width > 10 && r.height > 10) {
            const text = (el.innerText || '').trim();
            if (text) {
              result.push({
                text: text.substring(0, 30),
                x: Math.round(r.x + r.width/2),
                y: Math.round(r.y + r.height/2)
              });
            }
          }
        });
        return result;
      });
      
      console.log('\n=== Caption 화면 버튼 ===');
      buttons3.forEach(b => console.log(`  "${b.text}" (${b.x}, ${b.y})`));
      
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
      
      await igPage.screenshot({ path: 'ig_caption_ready.png' });
      
      // Find "공유" / "Share" button
      const shareBtn = buttons3.find(b => b.text === '공유');
      if (shareBtn) {
        console.log(`\n✅ "공유" 클릭 (${shareBtn.x}, ${shareBtn.y})`);
        await igPage.mouse.click(shareBtn.x, shareBtn.y);
        await igPage.waitForTimeout(5000);
        await igPage.screenshot({ path: 'ig_shared.png' });
        console.log('\n🎉 게시물 발행 완료!');
      } else {
        console.log('\n❌ "공유" 버튼 없음 - 직접 눌러주세요');
      }
    } else {
      console.log('\n❌ 두번째 "다음" 없음');
    }
  } else {
    console.log('\n❌ "다음" 버튼 없음 - 직접 확인 필요');
  }
  
  await browser.close();
})();
