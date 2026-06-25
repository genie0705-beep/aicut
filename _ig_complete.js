const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const path = require('path');
const WORKSPACE = 'C:\\Users\\paul\\.openclaw\\workspace';
const CARDS = ['aicut_card_reels_01.png','aicut_card_reels_02.png','aicut_card_reels_03.png','aicut_card_reels_04.png'];

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const pages = b.contexts()[0].pages();
  
  let ig;
  for (const p of pages) {
    if (p.url().includes('instagram')) { ig = p; break; }
  }
  if (!ig) { console.log('no ig'); await b.close(); return; }
  
  await ig.bringToFront();
  await ig.waitForTimeout(1000);
  
  // Click "게시물" in the dropdown
  const postBtn = await ig.evaluate(() => {
    const all = document.querySelectorAll('div[role="button"], span[role="button"], a[role="button"]');
    for (const el of all) {
      const text = (el.innerText || '').trim();
      const r = el.getBoundingClientRect();
      if (text === '게시물' && r.width > 10) {
        el.click();
        return { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) };
      }
    }
    return null;
  });
  
  if (postBtn) {
    console.log('Clicked 게시물');
  } else {
    // Try to find create dropdown and click 게시물
    console.log('게시물 not found directly, trying alternatives...');
    const allBtns = await ig.evaluate(() => {
      return Array.from(document.querySelectorAll('div[role="button"], span[role="button"]'))
        .filter(el => el.getBoundingClientRect().width > 10)
        .map(el => ({ text: (el.innerText || '').trim().substring(0, 15), x: Math.round(el.getBoundingClientRect().x + el.getBoundingClientRect().width/2), y: Math.round(el.getBoundingClientRect().y + el.getBoundingClientRect().height/2) }));
    });
    console.log('All buttons:', allBtns.map(b => b.text).join(', '));
    
    const found = allBtns.find(b => b.text === '게시물');
    if (found) {
      await ig.mouse.click(found.x, found.y);
      console.log('Clicked 게시물 via coordinate');
    } else {
      console.log('No 게시물 button');
      await ig.screenshot({ path: 'ig_no_post.png' });
      await b.close();
      return;
    }
  }
  
  await ig.waitForTimeout(3000);
  await ig.screenshot({ path: 'ig_after_post.png' });
  
  // Now upload files
  const fileInput = ig.locator('input[type="file"]').first();
  const count = await ig.locator('input[type="file"]').count();
  console.log('File inputs:', count);
  
  if (count > 0) {
    await ig.evaluate(() => {
      document.querySelectorAll('input[type="file"]').forEach(inp => { inp.multiple = true; });
    });
    await ig.waitForTimeout(300);
    
    const filePaths = CARDS.map(f => path.join(WORKSPACE, f));
    await ig.locator('input[type="file"]').first().setInputFiles(filePaths);
    console.log('✅ 4장 업로드 완료');
    await ig.waitForTimeout(3000);
    
    // Navigate through screens
    for (let step = 0; step < 5; step++) {
      await ig.screenshot({ path: `ig_s${step}.png` });
      
      const btns = await ig.evaluate(() => {
        return Array.from(document.querySelectorAll('div[role="button"]'))
          .filter(el => el.getBoundingClientRect().width > 10)
          .map(el => ({ text: (el.innerText || '').trim().substring(0, 15), x: Math.round(el.getBoundingClientRect().x + el.getBoundingClientRect().width/2), y: Math.round(el.getBoundingClientRect().y + el.getBoundingClientRect().height/2) }));
      });
      
      const target = btns.find(b => b.text === '다음') || btns.find(b => b.text === '공유');
      if (!target) {
        console.log(`Step ${step}: No 다음/공유 button`);
        
        // If we have a caption textarea, paste caption
        if (step > 1) {
          const caption = `릴스 조회수, 3일 만든 영상보다 3시간 만든 영상이 더 잘 나가는 이유 🎬\n\n3일 동안 기획·촬영·편집한 릴스 = 조회수 200\n대충 찍고 간단 편집한 릴스 = 조회수 2.3만\n\n차이가 100배... 왜 이런 일이 발생할까요?\n\n📌 릴스 알고리즘의 핵심\n1️⃣ 처음 3초 (체류율)\n2️⃣ 다시보기 2회 이상 = 가중치 UP\n3️⃣ 공유/저장 = 바이럴 핵심\n4️⃣ 댓글/좋아요 = 참여 신호\n\n편집 퀄리티보다 메시지가 10배 더 중요합니다.\n에이컷은 메시지를 해치지 않는 선에서 깔끔하게 편집해드려요.\n\n👉 무료 상담: aicut.co.kr\n#릴스마케팅 #숏폼마케팅 #릴스조회수 #인스타릴스 #숏폼제작 #릴스편집 #릴스 #인스타마케팅 #영상편집 #릴스노하우 #숏폼영상 #릴스광고 #콘텐츠마케팅 #마케팅 #영상편집외주 #영상편집대행 #릴스제작 #에이컷 #aicuts #숏폼콘텐츠 #영상제작 #숏폼에디터 #릴스전문 #영상편집서비스`;
          await ig.evaluate((t) => navigator.clipboard.writeText(t), caption);
          await ig.waitForTimeout(300);
          await ig.keyboard.press('Control+v');
          await ig.waitForTimeout(2000);
          console.log('✅ 캡션 붙여넣기');
        }
        break;
      }
      
      console.log(`Step ${step}: "${target.text}" at (${target.x}, ${target.y})`);
      await ig.mouse.click(target.x, target.y);
      await ig.waitForTimeout(2000);
      
      // After clicking "공유", we're done
      if (target.text === '공유') {
        console.log('\n🎉 게시물 발행 완료!');
        await ig.waitForTimeout(5000);
        await ig.screenshot({ path: 'ig_done.png' });
        break;
      }
    }
  } else {
    console.log('No file inputs - modal might not be open');
    await ig.screenshot({ path: 'ig_no_modal.png' });
  }
  
  await b.close();
})();
