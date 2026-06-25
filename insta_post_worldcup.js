const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// 인스타 캡션 (블로그 내용 변환)
const CAPTION = `2026 월드컵 열기, 숏폼 마케팅으로 잡는 방법 ⚽

릴스 15초, 쇼츠 30초, 틱톡 15초 — 각 플랫폼 특성에 맞게 최적화하세요. 경기 종료 후 30분이 골든타임입니다.

바쁜 시즌, 영상 편집은 에이컷에 맡기세요. 촬영 원본만 보내주시면 릴스/쇼츠/틱톡에 맞게 편집해 드립니다 📱

#월드컵 #월드컵마케팅 #숏폼마케팅 #릴스마케팅 #영상편집아웃소싱 #에이컷 #릴스알고리즘 #스포츠마케팅 #인스타마케팅 #영상편집`;

(async () => {
  console.log('=== 인스타그램 게시물 등록 ===\n');
  
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  // Instagram 탭 찾기
  let page = ctx.pages().find(p => p.url().includes('instagram.com/aicut'));
  if (!page) page = ctx.pages().find(p => p.url().includes('instagram'));
  if (!page) { console.log('인스타 탭 없음'); await ctx.close(); return; }
  
  await page.bringToFront();
  await page.waitForTimeout(3000);
  console.log('현재 URL:', page.url().substring(0, 80));
  
  // + 버튼 클릭 (새 게시물)
  console.log('\n1. + 버튼 클릭...');
  const plusBtn = await page.$('svg[aria-label="새 게시물"], svg[aria-label="New post"], a[href="/create"]');
  if (plusBtn) {
    await plusBtn.click();
    console.log('   ✅ + 버튼 클릭');
  } else {
    // CSS 셀렉터 fallback
    const clicked = await page.evaluate(() => {
      const btns = document.querySelectorAll('[aria-label="새 게시물"], [aria-label="New post"]');
      if (btns.length > 0) { btns[0].click(); return true; }
      // 모든 svg 중 create/plus 관련
      const allSvgs = document.querySelectorAll('svg');
      for (const svg of allSvgs) {
        const label = svg.getAttribute('aria-label') || '';
        if (label.includes('새') || label.includes('New') || label.includes('create')) {
          svg.closest('div')?.click() || svg.click();
          return true;
        }
      }
      return false;
    });
    console.log(`   + 버튼: ${clicked ? '✅' : '❌'}`);
  }
  
  await sleep(3000);
  
  // 파일 선택: aicut_worldcup_main.png
  const imgPath = path.join(__dirname, 'aicut_worldcup_main.png');
  if (!fs.existsSync(imgPath)) {
    console.log('   ❌ 이미지 파일 없음:', imgPath);
    console.log('   대체 이미지 사용...');
    // 다른 이미지 찾기
    const altImgs = ['aicut_worldcup_01.png', 'aicut_worldcup_cta.png', 'aicut_commute_thumb.png'];
    let found = false;
    for (const name of altImgs) {
      const p = path.join(__dirname, name);
      if (fs.existsSync(p)) {
        console.log('   사용:', name);
        await page.waitForTimeout(1000);
        const [fc] = await Promise.all([
          page.waitForEvent('filechooser', { timeout: 10000 }).catch(() => null),
          page.click('input[type="file"], button:has(input[type="file"]), [accept*="image"]').catch(() => {})
        ]);
        if (fc) { await fc.setFiles([p]); found = true; break; }
      }
    }
    if (!found) { console.log('   ❌ 파일 선택 실패'); await ctx.close(); return; }
  } else {
    console.log('   이미지 파일 확인:', imgPath);
    await sleep(1000);
    
    // filechooser 이벤트 대기 + 클릭
    const [fc] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 10000 }).catch(() => null),
      page.evaluate(() => {
        // file input 찾아서 클릭
        const input = document.querySelector('input[type="file"]');
        if (input) { input.click(); return; }
        // 아니면 "컴퓨터에서 선택" 버튼
        const btns = document.querySelectorAll('button, div[role="button"]');
        for (const btn of btns) {
          const t = (btn.textContent || '').trim();
          if (t.includes('컴퓨터에서') || t.includes('Select from computer') || t.includes('파일 선택')) {
            btn.click(); return;
          }
        }
      })
    ]);
    
    if (fc) {
      await fc.setFiles([imgPath]);
      console.log('   ✅ 이미지 선택 완료');
    } else {
      console.log('   ❌ filechooser 응답 없음');
    }
  }
  
  await sleep(3000);
  
  // 다음 버튼
  const nextBtn = await page.$('div[role="button"]:has-text("다음"), button:has-text("Next"), div:has-text("다음")');
  if (nextBtn) { await nextBtn.click(); console.log('   ✅ 다음 버튼'); }
  else {
    await page.evaluate(() => {
      const all = document.querySelectorAll('div[role="button"], button');
      for (const el of all) {
        if ((el.textContent || '').trim().includes('다음') || (el.textContent || '').trim() === 'Next') {
          el.click(); return;
        }
      }
    });
  }
  await sleep(3000);
  
  // 캡션 입력
  console.log('\n2. 캡션 입력...');
  const captionArea = await page.$('[aria-label="문구 입력"], [aria-label="Write a caption..."], textarea, [contenteditable="true"]');
  if (captionArea) {
    await captionArea.click();
    await sleep(500);
    await captionArea.fill(CAPTION);
    console.log('   ✅ 캡션 입력 완료');
  } else {
    await page.evaluate((text) => {
      const areas = document.querySelectorAll('textarea, [contenteditable="true"]');
      for (const el of areas) {
        if (el.offsetParent !== null) {
          el.focus();
          el.value = text;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          return;
        }
      }
    }, CAPTION);
    console.log('   ✅ 캡션 입력 (fallback)');
  }
  
  await sleep(2000);
  
  // 위치=서울
  console.log('3. 위치 설정...');
  // 위치 추가 버튼 클릭
  await page.evaluate(() => {
    const all = document.querySelectorAll('div[role="button"], button, span');
    for (const el of all) {
      const t = (el.textContent || '').trim();
      if (t.includes('위치 추가') || t.includes('Add location')) {
        el.closest('div[role="button"]')?.click() || el.click();
        return;
      }
    }
  });
  await sleep(2000);
  
  // 서울 검색
  const searchArea = await page.$('input[placeholder="검색"], input[placeholder="Search"]');
  if (searchArea) {
    await searchArea.fill('서울');
    await sleep(2000);
    
    // 첫 번째 결과 클릭
    const firstLoc = await page.$('div[role="button"]:has-text("서울"), div:-s-has(> span:has-text("서울"))');
    if (firstLoc) { await firstLoc.click(); console.log('   ✅ 위치: 서울'); }
    else {
      await page.evaluate(() => {
        const items = document.querySelectorAll('div[role="button"]');
        for (const item of items) {
          if ((item.textContent || '').includes('서울')) { item.click(); return; }
        }
      });
    }
  }
  await sleep(1000);
  
  // 공유
  console.log('\n4. 공유...');
  const shareBtn = await page.$('div[role="button"]:has-text("공유"), button:has-text("Share"), div:has-text("공유하기")');
  if (shareBtn) { await shareBtn.click(); console.log('   ✅ 공유 버튼 클릭'); }
  else {
    await page.evaluate(() => {
      const all = document.querySelectorAll('div[role="button"], button');
      for (const el of all) {
        if ((el.textContent || '').trim().includes('공유') || (el.textContent || '').trim() === 'Share') {
          el.click(); return;
        }
      }
    });
    console.log('   ✅ 공유 버튼 클릭 (fallback)');
  }
  
  await sleep(5000);
  
  // 결과 확인
  const currentUrl = page.url();
  console.log('\n5. 현재 URL:', currentUrl.substring(0, 80));
  console.log('\n✅ 게시물 등록 완료 (피드 확인 필요)');
  
  await ctx.close();
})().catch(e => console.error('FATAL:', e.message));
