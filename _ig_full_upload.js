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
    const url = p.url();
    if (url.includes('instagram')) { igPage = p; break; }
  }
  if (!igPage) {
    igPage = await ctx.newPage();
    await igPage.goto('https://www.instagram.com/', { waitUntil: 'networkidle', timeout: 30000 });
    await igPage.waitForTimeout(3000);
  }
  
  await igPage.bringToFront();
  await igPage.waitForTimeout(2000);
  
  // Navigate to main feed if on profile
  const currentUrl = igPage.url();
  console.log('Current URL:', currentUrl);
  
  if (currentUrl.includes('/aicut.official/') || currentUrl.includes('/profile/')) {
    // Go to main Instagram page for sidebar
    await igPage.goto('https://www.instagram.com/', { waitUntil: 'networkidle', timeout: 30000 });
    await igPage.waitForTimeout(3000);
    console.log('Navigated to main feed');
  }
  
  // Find "+" (새로운 게시물) button in sidebar
  const createBtn = await igPage.evaluate(() => {
    const svgs = document.querySelectorAll('svg');
    for (const svg of svgs) {
      const label = svg.getAttribute('aria-label');
      if (label === '새로운 게시물' || label === 'New post') {
        const parent = svg.closest('[role="button"]') || svg.parentElement;
        const r = (parent || svg).getBoundingClientRect();
        return { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) };
      }
    }
    // Try text search
    const allBtns = document.querySelectorAll('div[role="button"]');
    for (const btn of allBtns) {
      const text = (btn.innerText || '').trim();
      const r = btn.getBoundingClientRect();
      if ((text.includes('새로운') || text.includes('create')) && r.width > 10) {
        return { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) };
      }
    }
    return null;
  });
  
  if (createBtn) {
    console.log('✅ "새로운 게시물" 버튼 발견:', createBtn.x, createBtn.y);
    await igPage.mouse.click(createBtn.x, createBtn.y);
    await igPage.waitForTimeout(3000);
    await igPage.screenshot({ path: 'ig_create_modal.png' });
    
    // Set multiple on file input and upload
    const fileInput = igPage.locator('input[type="file"]').first();
    const fileCount = await igPage.locator('input[type="file"]').count();
    console.log('File inputs found:', fileCount);
    
    if (fileCount > 0) {
      // Set multiple attribute to true
      await igPage.evaluate(() => {
        const inputs = document.querySelectorAll('input[type="file"]');
        for (const inp of inputs) {
          inp.multiple = true;
        }
      });
      
      await igPage.waitForTimeout(500);
      
      // Upload all 4 files
      const filePaths = CARDS.map(f => path.join(WORKSPACE, f));
      await igPage.locator('input[type="file"]').first().setInputFiles(filePaths);
      console.log('✅ 4장 업로드 완료!');
      await igPage.waitForTimeout(3000);
      
      // Now handle all "다음" and "공유" buttons
      for (let step = 0; step < 3; step++) {
        await igPage.screenshot({ path: `ig_step_${step}.png` });
        
        // Find all buttons
        const btns = await igPage.evaluate(() => {
          const result = [];
          document.querySelectorAll('div[role="button"], button').forEach(el => {
            const r = el.getBoundingClientRect();
            if (r.width > 10 && r.height > 10) {
              const text = (el.innerText || '').trim();
              if (text) {
                result.push({ text: text.substring(0, 20), x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) });
              }
            }
          });
          return result;
        });
        
        console.log(`Step ${step} buttons:`, btns.map(b => b.text).join(', '));
        
        // Try "다음" first, then "공유"
        let target = btns.find(b => b.text === '다음');
        if (!target) target = btns.find(b => b.text === '공유' || b.text === 'Share');
        
        if (target) {
          console.log(`  Clicking: "${target.text}" at (${target.x}, ${target.y})`);
          await igPage.mouse.click(target.x, target.y);
          await igPage.waitForTimeout(3000);
        } else {
          console.log(`  No target button found for step ${step}`);
          break;
        }
      }
      
      // After reaching caption screen, paste caption
      await igPage.screenshot({ path: 'ig_caption_area.png' });
      
      const caption = `릴스 조회수, 3일 만든 영상보다 3시간 만든 영상이 더 잘 나가는 이유 🎬

3일 동안 기획·촬영·편집한 릴스 = 조회수 200
대충 찍고 간단 편집한 릴스 = 조회수 2.3만

차이가 100배... 왜 이런 일이 발생할까요?

📌 릴스 알고리즘의 핵심
1️⃣ 처음 3초 (체류율)
2️⃣ 다시보기 2회 이상 = 가중치 UP
3️⃣ 공유/저장 = 바이럴 핵심
4️⃣ 댓글/좋아요 = 참여 신호

편집 퀄리티보다 메시지가 10배 더 중요합니다.
에이컷은 메시지를 해치지 않는 선에서 깔끔하게 편집해드려요.

👉 무료 상담: aicut.co.kr
#릴스마케팅 #숏폼마케팅 #릴스조회수 #인스타릴스 #숏폼제작 #릴스편집 #릴스 #인스타마케팅 #영상편집 #릴스노하우 #숏폼영상 #릴스광고 #콘텐츠마케팅 #마케팅 #영상편집외주 #영상편집대행 #릴스제작 #에이컷 #aicuts #숏폼콘텐츠 #영상제작 #숏폼에디터 #릴스전문 #영상편집서비스`;

      await igPage.evaluate((t) => navigator.clipboard.writeText(t), caption);
      await igPage.waitForTimeout(500);
      await igPage.keyboard.press('Control+v');
      await igPage.waitForTimeout(2000);
      console.log('✅ 캡션 붙여넣기 완료');
      
      await igPage.screenshot({ path: 'ig_final_caption.png' });
      
      // Try "공유" once more
      const shareBtns = await igPage.evaluate(() => {
        const result = [];
        document.querySelectorAll('div[role="button"], button').forEach(el => {
          const r = el.getBoundingClientRect();
          if (r.width > 10 && r.height > 10) {
            const text = (el.innerText || '').trim();
            if (text === '공유' || text === 'Share') {
              result.push({ text, x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) });
            }
          }
        });
        return result;
      });
      
      if (shareBtns.length > 0) {
        const sb = shareBtns[0];
        console.log(`✅ "공유" 클릭 (${sb.x}, ${sb.y})`);
        await igPage.mouse.click(sb.x, sb.y);
        await igPage.waitForTimeout(5000);
        console.log('\n🎉 인스타 카드뉴스 4장 발행 완료!');
        await igPage.screenshot({ path: 'ig_published.png' });
      } else {
        console.log('\n⚠️ "공유" 버튼을 찾을 수 없습니다. 직접 눌러주세요.');
      }
    }
  } else {
    console.log('❌ "새로운 게시물" 버튼을 찾을 수 없음');
    await igPage.screenshot({ path: 'ig_no_create.png' });
  }
  
  await browser.close();
})();
