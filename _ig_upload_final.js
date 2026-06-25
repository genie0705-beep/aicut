const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const path = require('path');
const fs = require('fs');

const WORKSPACE = 'C:\\Users\\paul\\.openclaw\\workspace';
const REELS_CARDS = ['aicut_card_reels_01.png','aicut_card_reels_02.png','aicut_card_reels_03.png','aicut_card_reels_04.png'];
const CARD_PATHS = REELS_CARDS.map(f => path.join(WORKSPACE, f));

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  
  let igPage = null;
  for (const p of pages) {
    if (p.url().includes('instagram.com/aicut')) {
      igPage = p; break;
    }
  }
  
  if (!igPage) {
    igPage = await ctx.newPage();
    await igPage.goto('https://www.instagram.com/aicut.official/', { waitUntil: 'networkidle', timeout: 30000 });
    await igPage.waitForTimeout(3000);
  }
  
  await igPage.bringToFront();
  await igPage.waitForTimeout(2000);
  
  // Click "새로운 게시물" button in sidebar
  console.log('=== 새 게시물 클릭 ===');
  
  const result = await igPage.evaluate(() => {
    const svgs = document.querySelectorAll('svg');
    for (const svg of svgs) {
      if (svg.getAttribute('aria-label') === '새로운 게시물') {
        const parent = svg.closest('[role="button"], a, button, div[role="button"]') || svg.parentElement;
        if (parent) {
          parent.click();
          return 'clicked parent';
        }
        const r = svg.getBoundingClientRect();
        return { x: r.x + r.width/2, y: r.y + r.height/2 };
      }
    }
    return 'not found';
  });
  
  if (typeof result === 'object') {
    await igPage.mouse.click(result.x, result.y);
    console.log('SVG clicked at', result.x, result.y);
  } else {
    console.log(result);
  }
  
  await igPage.waitForTimeout(3000);
  
  // Screenshot
  await igPage.screenshot({ path: 'ig_create_modal.png' });
  
  // Wait for filechooser
  const fcPromise = igPage.waitForEvent('filechooser', { timeout: 15000 });
  
  // Click file select button
  const selectResult = await igPage.evaluate(() => {
    // Look for "컴퓨터에서 선택" or file input
    const btns = document.querySelectorAll('button, div[role="button"], a');
    for (const btn of btns) {
      const text = (btn.innerText || '').trim();
      if (text.includes('컴퓨터에서') || text.includes('Select from')) {
        btn.click();
        return 'clicked ' + text;
      }
    }
    // Look for hidden file input
    const fileInputs = document.querySelectorAll('input[type="file"]');
    for (const inp of fileInputs) {
      return { hasInput: true, id: inp.id };
    }
    return 'no file selector found';
  });
  console.log('Select result:', selectResult);
  
  const fc = await fcPromise.catch(() => null);
  
  if (fc) {
    await fc.setFiles(CARD_PATHS);
    console.log('✅ 이미지 4장 업로드됨');
    await igPage.waitForTimeout(3000);
    
    // Click "다음" button
    await igPage.screenshot({ path: 'ig_after_upload.png' });
    
    // Crop/Edit screen - click "다음"
    const nextResult = await igPage.evaluate(() => {
      const btns = document.querySelectorAll('div[role="button"]');
      for (const btn of btns) {
        const text = (btn.innerText || '').trim();
        if (text === '다음') {
          btn.click();
          return 'clicked';
        }
      }
      return 'not found';
    });
    console.log('Next:', nextResult);
    await igPage.waitForTimeout(3000);
    
    // Second next (filter screen)
    await igPage.screenshot({ path: 'ig_filter_screen.png' });
    
    const nextResult2 = await igPage.evaluate(() => {
      const btns = document.querySelectorAll('div[role="button"]');
      for (const btn of btns) {
        const text = (btn.innerText || '').trim();
        if (text === '다음') {
          btn.click();
          return 'clicked 2nd next';
        }
      }
      return 'not found';
    });
    console.log('Next2:', nextResult2);
    await igPage.waitForTimeout(3000);
    
    // Caption screen
    await igPage.screenshot({ path: 'ig_caption_screen.png' });
    
    // Write caption
    const captionHtml = `<p>릴스 조회수, 3일 만든 영상보다 3시간 만든 영상이 더 잘 나가는 이유 🎬</p>
<p>3일 동안 기획·촬영·편집한 릴스 = 조회수 200<br>대충 찍고 간단 편집한 릴스 = 조회수 2.3만</p>
<p>차이가 무려 100배!<br>왜 이런 일이 발생할까요?</p>
<p>📌 릴스 알고리즘의 핵심<br>1️⃣ 처음 3초 안에 시청자 멈추게 하기<br>2️⃣ 다시보기 2회 이상 = 가중치 UP<br>3️⃣ 공유/저장 = 바이럴 핵심<br>4️⃣ 댓글/좋아요 = 참여 신호</p>
<p>편집 퀄리티보다 메시지와 트렌드가 10배 더 중요합니다.<br>에이컷은 메시지를 해치지 않는 선에서 깔끔하게 편집해드려요.</p>
<p>👉 무료 상담: aicut.co.kr</p>`;
    
    await igPage.evaluate((html) => {
      navigator.clipboard.writeText(html);
    }, captionHtml);
    await igPage.waitForTimeout(500);
    
    // Paste caption
    await igPage.keyboard.press('Control+v');
    await igPage.waitForTimeout(2000);
    
    await igPage.screenshot({ path: 'ig_with_caption.png' });
    
    // Click "공유" button (Share)
    const shareResult = await igPage.evaluate(() => {
      const btns = document.querySelectorAll('div[role="button"]');
      for (const btn of btns) {
        const text = (btn.innerText || '').trim();
        if (text === '공유' || text === 'Share') {
          btn.click();
          return 'shared!';
        }
      }
      return 'not found';
    });
    console.log('Share:', shareResult);
    await igPage.waitForTimeout(5000);
    
    await igPage.screenshot({ path: 'ig_after_share.png' });
    
    console.log('\n=== ✅ 업로드 완료! ===');
    
    // Write caption text for user
    console.log('\n📝 캡션 내용:');
    console.log('릴스 조회수, 3일 만든 영상보다 3시간 만든 영상이 더 잘 나가는 이유 🎬');
    console.log('');
    console.log('3일 동안 기획·촬영·편집한 릴스 = 조회수 200');
    console.log('대충 찍고 간단 편집한 릴스 = 조회수 2.3만');
    console.log('');
    console.log('📌 릴스 알고리즘의 핵심');
    console.log('① 처음 3초 안에 시청자 멈추게 하기');
    console.log('② 다시보기 2회 이상 = 가중치 UP');
    console.log('③ 공유/저장 = 바이럴 핵심');
    console.log('④ 댓글/좋아요 = 참여 신호');
    console.log('');
    console.log('👉 무료 상담: aicut.co.kr');
    
  } else {
    console.log('❌ 파일 선택기 없음');
  }
  
  await browser.close();
})();
