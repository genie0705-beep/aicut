// 인스타그램 업로드 — 최적화 버전
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
    await page.goto('https://www.instagram.com/aicut.official/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
  }
  
  console.log('1️⃣ 만들기 버튼 클릭');
  // 좌측 네비게이션의 "만들기" a 링크 클릭
  const createLinks = await page.$$('a');
  for (const link of createLinks) {
    const text = await link.innerText();
    if (text.trim() === '만들기') {
      await link.click();
      console.log('  ✅ 만들기 클릭');
      break;
    }
  }
  await page.waitForTimeout(2000);
  
  console.log('2️⃣ 게시물 선택 → 파일 업로드');
  // file chooser 대기
  const fcPromise = page.waitForEvent('filechooser', { timeout: 15000 }).catch(() => null);
  
  // "게시물" 텍스트를 가진 메뉴 아이템 클릭
  const menuBtns = await page.$$('a, button, [role="button"], span');
  let clickedPost = false;
  for (const btn of menuBtns) {
    try {
      const text = await btn.innerText();
      if (text.trim() === '게시물' || text.trim() === 'Post') {
        await btn.click();
        clickedPost = true;
        console.log('  ✅ 게시물 클릭');
        break;
      }
    } catch (e) {}
  }
  
  if (!clickedPost) {
    console.log('  ❌ 게시물 메뉴 못 찾음');
    await page.screenshot({ path: 'debug_ig_menu.png', fullPage: true });
  }
  
  await page.waitForTimeout(2000);
  
  const fc = await fcPromise;
  if (fc) {
    await fc.setFiles(IMG_FILE);
    console.log('  ✅ 이미지 업로드됨');
  } else {
    // file chooser 안 열렸으면 hidden input 직접 사용
    console.log('  ⚠️ file chooser 없음, hidden input 직접 접근');
    const fileInputs = await page.$$('input[type="file"]');
    if (fileInputs.length > 0) {
      await fileInputs[0].setInputFiles(IMG_FILE);
      console.log('  ✅ hidden input으로 파일 설정');
    }
  }
  
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'debug_ig_step1.png', fullPage: true });
  
  // 현재 화면 텍스트 확인
  const text = await page.evaluate(() => (document.body.innerText || '').slice(0, 300));
  console.log('  화면:', text);
  
  await b.disconnect();
  console.log('\n✅ 1단계 완료');
}

main().catch(e => console.error('❌', e.message));
