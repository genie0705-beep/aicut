// 인스타그램 피드 업로드 — 부동산 블로그
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
  
  // Instagram 탭 (이미 열려있는 프로필 페이지)
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
  
  // 만들기 버튼 클릭 (nav의 + 아이콘 또는 새글쓰기)
  // Instagram 웹에서 만들기 버튼 찾기
  const createBtn = await page.evaluate(() => {
    // 다양한 만들기 버튼 셀렉터
    const selectors = [
      'a[href="/create"]',
      'a[href="/create/select"]',
      'svg[aria-label="새 게시물"]',
      'svg[aria-label="New post"]',
      'div[role="button"] svg[aria-label*="게시"]',
      'div[role="button"] svg[aria-label*="post"]',
      'svg[aria-label="새로운 게시물"]',
    ];
    
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        // svg면 부모 버튼 클릭
        if (el.tagName === 'svg') {
          const parent = el.closest('[role="button"], a, button, div[tabindex]');
          if (parent) {
            parent.click();
            return 'svg → parent clicked: ' + (parent.tagName);
          }
        }
        el.click();
        return 'clicked: ' + sel;
      }
    }
    
    // 헤더 영역에서 찾기
    const headers = document.querySelectorAll('header, nav, [role="navigation"]');
    for (const h of headers) {
      const btns = h.querySelectorAll('[role="button"], a, button');
      for (const btn of btns) {
        const html = btn.innerHTML.toLowerCase();
        if (html.includes('plus') || html.includes('create') || html.includes('new') || html.includes('+')){
          btn.click();
          return 'header btn clicked';
        }
      }
    }
    
    return '버튼 못 찾음';
  });
  console.log('  만들기:', createBtn);
  
  await page.waitForTimeout(2000);
  
  // file chooser 대기
  const fcPromise = page.waitForEvent('filechooser', { timeout: 10000 }).catch(() => null);
  
  // 파일 선택 다이얼로그 열기 (이미 열렸으면 바로, 아니면 "컴퓨터에서 선택" 버튼)
  const fileSelectResult = await page.evaluate(() => {
    // 이미 파일 선택 창이 떠있는 경우
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) return 'file input exists';
    
    // "컴퓨터에서 선택" 버튼
    const btns = Array.from(document.querySelectorAll('button, div[role="button"], a'));
    for (const btn of btns) {
      const text = btn.innerText || '';
      if (text.includes('컴퓨터에서') || text.includes('Select from computer') || text.includes('파일 선택')) {
        btn.click();
        return 'clicked computer select: ' + text.slice(0,30);
      }
    }
    return 'no computer select btn';
  });
  console.log('  파일 선택:', fileSelectResult);
  
  await page.waitForTimeout(1000);
  
  const fc = await fcPromise;
  if (fc) {
    await fc.setFiles(IMG_FILE);
    console.log('  ✅ 이미지 파일 설정 완료');
  } else {
    console.log('  ❌ file chooser 없음');
  }
  
  await page.waitForTimeout(3000);
  
  // 현재 화면 상태 확인
  console.log('2️⃣ 현재 화면 확인...');
  await page.screenshot({ path: 'debug_ig_step1.png', fullPage: true });
  
  const pageContent = await page.evaluate(() => (document.body.innerText || '').slice(0, 500));
  console.log('  화면:', pageContent);
  
  await b.disconnect();
  console.log('\n✅ 1단계 완료. 화면 확인 필요.');
}

main().catch(e => console.error('❌', e.message));
