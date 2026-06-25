const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const path = require('path');
const WORKSPACE = 'C:\\Users\\paul\\.openclaw\\workspace';
const CARDS = ['aicut_card_reels_01.png','aicut_card_reels_02.png','aicut_card_reels_03.png','aicut_card_reels_04.png'];

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const pages = b.contexts()[0].pages();
  
  // Find or create IG page
  let ig;
  for (const p of pages) { if (p.url().includes('instagram')) { ig = p; break; } }
  if (!ig) { 
    ig = await b.contexts()[0].newPage(); 
    await ig.goto('https://www.instagram.com/', { waitUntil: 'networkidle', timeout: 30000 });
    await ig.waitForTimeout(3000);
  }
  await ig.bringToFront();
  await ig.waitForTimeout(2000);
  
  // Step 1: Click the + button using native evaluate
  await ig.evaluate(() => {
    const svgs = document.querySelectorAll('svg');
    for (const svg of svgs) {
      if (svg.getAttribute('aria-label') === '새로운 게시물') {
        const btn = svg.closest('[role="button"]');
        if (btn) btn.click();
        return;
      }
    }
  });
  console.log('Clicked + button');
  await ig.waitForTimeout(2000);
  await ig.screenshot({ path: path.join(WORKSPACE, 'ig_after_plus.png') });
  
  // Step 2: Find ALL visible text elements (not just buttons)
  const allText = await ig.evaluate(() => {
    const result = [];
    document.querySelectorAll('*').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width > 20 && r.height > 10) {
        const t = (el.innerText || '').trim();
        if (t && (t === '게시물' || t === '릴스' || t === '라이브 방송' || t === '스토리' || t === 'Post' || t === 'Reel' || t === 'Story')) {
          result.push({ text: t, tag: el.tagName, x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2), w: Math.round(r.width), h: Math.round(r.height) });
        }
      }
    });
    return result;
  });
  console.log('Create options:', JSON.stringify(allText));
  
  if (allText.length > 0) {
    // Click the 게시물 option
    const postOpt = allText.find(t => t.text === '게시물');
    if (postOpt) {
      await ig.mouse.click(postOpt.x, postOpt.y);
      console.log('Clicked 게시물');
      await ig.waitForTimeout(3000);
      
      // Upload
      const count = await ig.locator('input[type="file"]').count();
      console.log('File inputs:', count);
      
      if (count > 0) {
        await ig.evaluate(() => { document.querySelectorAll('input[type="file"]').forEach(inp => { inp.multiple = true; }); });
        await ig.locator('input[type="file"]').first().setInputFiles(CARDS.map(f => path.join(WORKSPACE, f)));
        console.log('✅ 4장 업로드');
        await ig.waitForTimeout(3000);
        
        // Navigate through screens
        for (let s = 0; s < 5; s++) {
          await ig.screenshot({ path: path.join(WORKSPACE, `ig_step_${s}.png`) });
          
          const btns = await ig.evaluate(() => {
            return Array.from(document.querySelectorAll('div[role="button"]'))
              .filter(el => el.getBoundingClientRect().width > 10)
              .map(el => ({ text: (el.innerText || '').trim(), x: Math.round(el.getBoundingClientRect().x + el.getBoundingClientRect().width/2), y: Math.round(el.getBoundingClientRect().y + el.getBoundingClientRect().height/2) }));
          });
          
          const target = btns.find(b => b.text === '다음') || btns.find(b => b.text === '공유' || b.text === 'Share');
          if (!target) {
            if (s >= 2) {
              const caption = '릴스 조회수, 3일 만든 영상보다 3시간 만든 영상이 더 잘 나가는 이유 \uD83C\uDFAC\n\n3일 동안 기획 촬영 편집 = 조회수 200\n대충 찍고 간단 편집 = 조회수 2.3만\n\n차이가 100배... 이유는?\n\n1. 처음 3초 (체류율)\n2. 다시보기 2회 이상 = 가중치 UP\n3. 공유 저장 = 바이럴 핵심\n4. 댓글 좋아요 = 참여 신호\n\n편질보다 메시지가 10배 중요!\n\uD83D\uDC49 \uBB34\uB8CC \uC0C1\uB2F4: aicut.co.kr\n#\uB9B4\uC2A4\uB9C8\uCEE4\uD305 #\uC228\uD3FC\uB9C8\uCEE4\uD305 #\uB9B4\uC2A4\uC870\uD68C\uC218 #\uC778\uC2A4\uD0C0\uB9B4\uC2A4 #\uC228\uD3FC\uC81C\uC791 #\uB9B4\uC2A4\uD3B8\uC9D1 #\uB9B4\uC2A4 #\uC778\uC2A4\uD0C0\uB9C8\uCEE4\uD305 #\uC601\uC0C1\uD3B8\uC9D1 #\uB9B4\uC2A4\uB178\uD558\uC6B0 #\uC228\uD3FC\uC601\uC0C1 #\uCF58\uD150\uCE20\uB9C8\uCEE4\uD305 #\uB9C8\uCEE4\uD305 #\uC601\uC0C1\uD3B8\uC9D1\uC678\uC8FC #\uC601\uC0C1\uD3B8\uC9D1\uB300\uD589 #\uB9B4\uC2A4\uC81C\uC791 #\uC5D0\uC774\uCEF7 #aicuts #\uC228\uD3FC\uCF58\uD150\uCE20 #\uC601\uC0C1\uC81C\uC791 #\uC228\uD3FC\uC5D0\uB514\uD130 #\uB9B4\uC2A4\uC804\uBB38 #\uC601\uC0C1\uD3B8\uC9D1\uC11C\uBE44\uC2A4';
              await ig.evaluate((t) => navigator.clipboard.writeText(t), caption);
              await ig.waitForTimeout(300);
              await ig.keyboard.press('Control+v');
              await ig.waitForTimeout(2000);
              console.log('Caption pasted');
            }
            break;
          }
          console.log(`Step ${s}: ${target.text}`);
          await ig.mouse.click(target.x, target.y);
          await ig.waitForTimeout(2000);
          if (target.text === '공유') { console.log('✅ Shared!'); await ig.waitForTimeout(5000); break; }
        }
        
        console.log('\n=== Done ===');
        await ig.screenshot({ path: path.join(WORKSPACE, 'ig_final.png') });
      }
    } else {
      console.log('No 게시물 option found');
    }
  } else {
    console.log('No create options visible - trying alternative approach');
    // Maybe use direct URL
    await ig.goto('https://www.instagram.com/create/story/', { waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
    await ig.waitForTimeout(2000);
    console.log('After create URL:', ig.url());
    await ig.screenshot({ path: path.join(WORKSPACE, 'ig_create_url.png') });
  }
  
  await b.close();
})();
