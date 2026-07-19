const { chromium } = require('playwright');
const path = require('path');

const IMG_DIR = __dirname;
const IMG_FILES = [
  'insta_constitution_1.png',
  'insta_constitution_2.png',
  'insta_constitution_3.png',
  'insta_constitution_4.png',
  'insta_constitution_5.png',
];

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
  
  let insta = pages.find(p => p.url().includes('instagram.com/aicut'));
  if (!insta) {
    insta = await b.contexts()[0].newPage();
    await insta.goto('https://www.instagram.com/', { waitUntil: 'networkidle', timeout: 15000 });
  }
  await insta.bringToFront();
  await insta.waitForTimeout(2000);

  // 1. 만들기 버튼
  const created = await insta.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'));
    const create = links.find(a => a.href?.includes('/create') || a.innerHTML?.includes('plus') || a.getAttribute('aria-label')?.includes('새'));
    if (create) { create.click(); return 'clicked'; }
    return 'not found';
  });
  console.log('1. 만들기:', created);
  await insta.waitForTimeout(2000);

  // 2. 게시물 선택
  await insta.evaluate(() => {
    const items = Array.from(document.querySelectorAll('a, button, span, div'));
    const post = items.find(el => el.innerText?.includes('게시물'));
    if (post) post.click();
  });
  console.log('2. 게시물 선택');
  await insta.waitForTimeout(2000);

  // 3. 여러 파일 업로드
  const fileInput = await insta.$('input[type="file"]');
  if (fileInput) {
    const filePaths = IMG_FILES.map(f => path.join(IMG_DIR, f));
    await fileInput.setInputFiles(filePaths);
    console.log(`3. 파일 ${filePaths.length}장 업로드`);
    await insta.waitForTimeout(5000);
    
    // 4. 다음 버튼 (크롭 편집)
    const nextBtn1 = await insta.$('button:has-text("다음")');
    if (nextBtn1) { await nextBtn1.click(); console.log('4. 다음(크롭)'); }
    await insta.waitForTimeout(3000);
    
    // 5. 다음 버튼 (세부 설정)
    const nextBtn2 = await insta.$('button:has-text("다음")');
    if (nextBtn2) { await nextBtn2.click(); console.log('5. 다음(설정)'); }
    await insta.waitForTimeout(2000);
    
    // 6. 캡션 입력
    const textarea = await insta.$('textarea');
    if (textarea) {
      await textarea.evaluate((el, text) => {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        setter.call(el, text);
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }, CAPTION);
      console.log('6. 캡션 입력 완료');
      await insta.waitForTimeout(500);
    }
    
    // 7. 공유 버튼 확인
    const shareBtn = await insta.$('button:has-text("공유")');
    if (shareBtn) {
      console.log('\n⚠️ "공유" 버튼까지 도달! 정이사님께서 직접 클릭해주세요!');
      console.log('📸 5장 캐러셀 업로드 준비 완료');
    } else {
      console.log('공유 버튼 없음 - 추가 확인 필요');
    }
  } else {
    console.log('❌ file input 없음');
  }
  
  process.exit(0);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
