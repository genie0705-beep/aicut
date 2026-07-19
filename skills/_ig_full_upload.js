// 인스타그램 피드 업로드 — 전체 플로우
const { chromium } = require('playwright');
const path = require('path');

const WORKSPACE = path.join('C:', 'Users', 'paul', '.openclaw', 'workspace');
const IMG_FILE = path.join(WORKSPACE, 'aicut_blog_realestate_main.png');

const CAPTION = `부동산 중개사무소, 매물 영상 하나로 계약률이 달라집니다!

🏢 요즘 사진만 올리면 문의가 안 온다는 말,
공감하시는 분들 많으시죠?

고객들은 이제 영상을 원합니다.
매물 영상을 올린 중개사무소는
문의량이 평균 2~3배 증가했다고 해요.

📱 릴스·쇼츠 하나로 문의량 3배!
숏폼 마케팅, 더 이상 선택이 아닌 필수입니다.

🏗️ 하반기 분양 시즌, 지금부터 영상으로 준비하세요

✂️ 촬영은 직접 하고, 편집은 에이컷에 맡기세요
월 정기 납품, 합리적인 가격

💬 문의는 DM 또는 프로필 링크 클릭!

#부동산마케팅 #부동산영상 #공인중개사 #매물영상 #숏폼마케팅
#영상편집외주 #에이컷 #부동산SNS #릴스마케팅 #분양마케팅`;

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('instagram.com')) {
      page = p;
      break;
    }
  }
  if (!page) {
    page = await ctx.newPage();
    await page.goto('https://www.instagram.com/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
  }
  
  console.log('1️⃣ 새 게시물 만들기...');
  
  // + 버튼 클릭
  await page.evaluate(() => {
    // 만들기 버튼 (svg plus 아이콘의 부모 a 태그)
    const createLinks = document.querySelectorAll('a[href="/create"]');
    if (createLinks.length > 0) {
      createLinks[0].click();
      return;
    }
    
    // svg aria-label="새 게시물" 또는 "New" 찾기
    const svgs = document.querySelectorAll('svg');
    for (const svg of svgs) {
      const label = svg.getAttribute('aria-label') || '';
      if (label.includes('새') || label.includes('New') || label.includes('plus') || label.includes('Plus') || label.includes('create')) {
        const parent = svg.closest('[role="button"], a, button');
        if (parent) { parent.click(); return; }
        break;
      }
    }
    
    // 프로필 페이지의 "+" 찾기
    const allBtns = document.querySelectorAll('a, button, [role="button"]');
    for (const btn of allBtns) {
      const html = btn.innerHTML || '';
      const text = btn.innerText || '';
      if (html.includes('plus') || text.includes('만들기') || text.includes('Create') || btn.querySelector('svg[aria-label*="새"]') || btn.querySelector('svg[aria-label*="New"]')) {
        btn.click();
        return;
      }
    }
  });
  
  await page.waitForTimeout(2000);
  
  // "게시물" 메뉴 클릭
  console.log('  게시물 메뉴 선택...');
  await page.evaluate(() => {
    const menuItems = document.querySelectorAll('a, button, div[role="menuitem"], div[role="button"], span');
    for (const item of menuItems) {
      const text = item.innerText || '';
      if (text === '게시물' || text === 'Post') {
        item.click();
        return;
      }
    }
    // span 내 "게시물" 찾기
    const spans = document.querySelectorAll('span');
    for (const s of spans) {
      if (s.innerText === '게시물') {
        s.closest('[role="button"], a, button, div[tabindex]')?.click();
        return;
      }
    }
  });
  
  await page.waitForTimeout(2000);
  
  // file chooser 대기
  console.log('  이미지 선택...');
  const fcPromise = page.waitForEvent('filechooser', { timeout: 15000 }).catch(() => null);
  
  // 파일 선택 input이 없으면 "컴퓨터에서 선택" 버튼 클릭
  await page.evaluate(() => {
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) return; // 이미 열려있음
    
    const btns = Array.from(document.querySelectorAll('button, div[role="button"], a'));
    for (const btn of btns) {
      const text = btn.innerText || '';
      if (text.includes('컴퓨터에서') || text.includes('Select from computer')) {
        btn.click();
        return;
      }
    }
  });
  
  await page.waitForTimeout(1000);
  
  const fc = await fcPromise;
  if (fc) {
    await fc.setFiles(IMG_FILE);
    console.log('  ✅ 이미지 업로드됨');
  } else {
    console.log('  ❌ file chooser 없음, 화면 확인 필요');
    await page.screenshot({ path: 'debug_ig_error.png', fullPage: true });
    await b.disconnect();
    return;
  }
  
  await page.waitForTimeout(3000);
  
  // "다음" 버튼 클릭 (1차 - 자르기 화면)
  console.log('2️⃣ 다음(자르기)...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('div[role="button"], button, span'));
    for (const btn of btns) {
      const text = btn.innerText || '';
      if (text === '다음' || text === 'Next') {
        btn.click();
        return;
      }
    }
  });
  
  await page.waitForTimeout(3000);
  
  // "다음" 버튼 클릭 (2차 - 필터 화면)
  console.log('3️⃣ 다음(필터)...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('div[role="button"], button, span'));
    for (const btn of btns) {
      const text = btn.innerText || '';
      if (text === '다음' || text === 'Next') {
        btn.click();
        return;
      }
    }
  });
  
  await page.waitForTimeout(2000);
  
  // 캡션 입력
  console.log('4️⃣ 내용 입력...');
  await page.evaluate((caption) => {
    // 캡션 입력 영역 찾기
    const textareas = document.querySelectorAll('textarea, div[role="textbox"], [contenteditable]');
    for (const ta of textareas) {
      const placeholder = ta.getAttribute('placeholder') || '';
      if (placeholder.includes('문구') || placeholder.includes('입력') || placeholder.includes('caption') || ta.innerText === '') {
        ta.focus();
        // execCommand로 붙여넣기
        const sel = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(ta);
        sel.removeAllRanges();
        sel.addRange(range);
        
        // clipboard API로 캡션 복사 후 붙여넣기
        navigator.clipboard.writeText(caption).then(() => {
          document.execCommand('paste');
        });
        return;
      }
    }
  }, CAPTION);
  
  await page.waitForTimeout(2000);
  
  // 위치 설정 (서울)
  console.log('5️⃣ 위치 설정...');
  await page.evaluate(() => {
    // 위치 추가 버튼
    const btns = Array.from(document.querySelectorAll('div[role="button"], button, span'));
    for (const btn of btns) {
      const text = btn.innerText || '';
      if (text.includes('위치') || text.includes('Location') || text.includes('장소')) {
        btn.click();
        return;
      }
    }
  });
  
  await page.waitForTimeout(2000);
  
  // "서울" 검색
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input[type="text"], input[placeholder*="검색"], input[placeholder*="Search"]');
    for (const inp of inputs) {
      inp.focus();
      inp.value = '서울';
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }
  });
  
  await page.waitForTimeout(2000);
  
  // 검색 결과에서 "서울" 선택
  await page.evaluate(() => {
    const items = document.querySelectorAll('div[role="option"], div[role="button"], div[class*="location"]');
    for (const item of items) {
      const text = item.innerText || '';
      if (text.includes('서울') && text.includes('대한민국')) {
        item.click();
        return;
      }
    }
  });
  
  await page.waitForTimeout(1000);
  
  // 공유 버튼 클릭
  console.log('6️⃣ 공유...');
  const shareText = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('div[role="button"], button'));
    for (const btn of btns) {
      const text = btn.innerText || '';
      if (text === '공유' || text === 'Share') {
        btn.click();
        return '공유 클릭됨';
      }
    }
    return '공유 버튼 없음';
  });
  console.log('  ', shareText);
  
  await page.waitForTimeout(5000);
  
  // 결과 확인
  await page.screenshot({ path: 'debug_ig_final.png', fullPage: true });
  console.log('✅ 스크린샷 저장');
  
  const finalText = await page.evaluate(() => (document.body.innerText || '').slice(0, 300));
  console.log('최종 화면:', finalText);
  
  await b.disconnect();
  console.log('\n✅ 인스타그램 업로드 완료!');
}

main().catch(e => console.error('❌', e.message));
