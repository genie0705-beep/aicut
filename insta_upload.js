const { chromium } = require('playwright');
const path = require('path');

const IMG_PATH = path.join(__dirname, 'insta_constitution_2026.png');
const CAPTION = `2026 제헌절, 19년 만에 돌아온 공휴일! 🎉

7월 17일 금요일, 토·일까지 3일 연휴 완성.
가족·연인과 즐기는 서울 행사 총정리✨

🎶 7/17 당일 무료!
사운드나루@서울 한일 뮤지션 쇼케이스 (서교스퀘어)
광화문 헌법 미디어아트
서울풍물시장 주말장터

🏖️ 7월 서울 축제
서울썸머비치 (7/20~ 광화문)
DDP 바캉스 뮤직페스티벌 (7/31~)
성북문화바캉스 (7/25~)

추억은 영상으로 남기세요 🎥
에이컷에서 편집 도와드립니다

#제헌절 #2026제헌절 #공휴일 #3일연휴 #서울행사 #서울데이트 #가족나들이 #무료공연 #광화문 #서울썸머비치 #DDP바캉스 #사운드나루 #영상편집 #에이컷`;

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  
  // Instagram 탭
  let insta = pages.find(p => p.url().includes('instagram.com/aicut'));
  if (!insta) {
    console.log('Insta 탭 없음, 새로 열기');
    insta = await b.contexts()[0].newPage();
    await insta.goto('https://www.instagram.com/aicut.official/', { waitUntil: 'networkidle', timeout: 15000 });
  }
  await insta.bringToFront();
  await insta.waitForTimeout(2000);
  
  // 1. 만들기 버튼 클릭
  const createBtn = await insta.$('a[href*="create"], a[aria-label*="새"], a[aria-label*="New"], svg[aria-label*="새"]');
  if (createBtn) {
    await createBtn.click();
    console.log('✅ 만들기 클릭');
  } else {
    // SVG 찾기
    const svgBtn = await insta.evaluate(() => {
      const svg = document.querySelector('svg[aria-label="새 게시물"], svg[aria-label="New post"]');
      if (svg) { svg.closest('a')?.click(); return true; }
      // nav에서 + 버튼 찾기
      const plusIcon = Array.from(document.querySelectorAll('a')).find(a => a.innerHTML.includes('plus') || a.innerHTML.includes('+'));
      if (plusIcon) { plusIcon.click(); return true; }
      return false;
    });
    if (svgBtn) console.log('✅ 만들기 SVG 클릭');
  }
  await insta.waitForTimeout(2000);
  
  // 2. 게시물 선택
  const postOpt = await insta.$('a[href*="create/select"], button:has-text("게시물"), span:has-text("게시물"), div:has-text("게시물")');
  if (postOpt) {
    await postOpt.click();
    console.log('✅ 게시물 선택');
  } else {
    // 모든 버튼 검색
    await insta.evaluate(() => {
      const items = Array.from(document.querySelectorAll('a, button, span, div'));
      const post = items.find(el => el.innerText?.includes('게시물'));
      if (post) post.click();
    });
    console.log('✅ 게시물 선택 (검색)');
  }
  await insta.waitForTimeout(2000);
  
  // 3. 파일 업로드
  const fileInput = await insta.$('input[type="file"]');
  if (fileInput) {
    await fileInput.setInputFiles(IMG_PATH);
    console.log('✅ 파일 업로드');
    await insta.waitForTimeout(3000);
    
    // 4. 다음 버튼 × 2
    for (let i = 0; i < 2; i++) {
      const nextBtn = await insta.$('button:has-text("다음")');
      if (nextBtn) {
        await nextBtn.click();
        console.log(`✅ 다음 ${i+1}/2`);
        await insta.waitForTimeout(2000);
      }
    }
    
    // 5. 캡션 입력
    const textarea = await insta.$('textarea');
    if (textarea) {
      await textarea.evaluate((el, text) => {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        nativeSetter.call(el, text);
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }, CAPTION);
      console.log('✅ 캡션 입력');
      await insta.waitForTimeout(1000);
    }
    
    // 6. 공유
    const shareBtn = await insta.$('button:has-text("공유")');
    if (shareBtn) {
      console.log('⚠️ 공유 버튼 발견됨. 정이사님 확인 후 클릭 필요!');
      // 자동 클릭 금지 (AGENTS.md 정책)
    }
    
    console.log('\n✅ 인스타그램 업로드 준비 완료!');
    console.log('정이사님, "공유" 버튼만 클릭해주세요!');
    
  } else {
    console.log('❌ file input 없음');
  }
  
  process.exit(0);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
