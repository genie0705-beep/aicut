const { chromium } = require('playwright');
const path = require('path');

const IMG_DIR = __dirname;
const IMG_FILES = ['insta_constitution_1.png','insta_constitution_2.png','insta_constitution_3.png','insta_constitution_4.png','insta_constitution_5.png'];
const CAPTION = `2026 제헌절, 19년 만에 돌아온 공휴일! 🎉
7월 17일 금요일, 3일 연휴 즐기는 서울 행사 총정리✨

🎶 당일 무료! 사운드나루 쇼케이스
🏛️ 광화문 헌법 미디어아트
🏖️ 서울썸머비치·DDP 바캉스

추억은 영상으로! 에이컷에서 편집 도와드립니다🎥

#제헌절 #2026제헌절 #공휴일 #3일연휴 #서울행사 #서울데이트 #무료공연 #광화문 #서울썸머비치 #에이컷`;

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  // 새 탭에서 인스타 열기 (기존 탭은 닫힌 상태 가정)
  const insta = await ctx.newPage();
  await insta.goto('https://www.instagram.com/', { waitUntil: 'networkidle', timeout: 20000 });
  await insta.waitForTimeout(3000);
  
  // 1. 만들기 버튼 찾기 (svg aria-label 방식)
  const made = await insta.evaluate(() => {
    // header 영역의 + 버튼 찾기
    const allSvgs = document.querySelectorAll('svg');
    for (const svg of allSvgs) {
      const aria = svg.getAttribute('aria-label') || '';
      if (aria.includes('새') || aria.includes('New') || aria === '게시물' || aria === 'Post') {
        const parent = svg.closest('a, button, [role="button"]');
        if (parent) { parent.click(); return 'svg:' + aria; }
        svg.click();
        return 'svg:' + aria;
      }
    }
    // nav 영역의 모든 링크
    const links = Array.from(document.querySelectorAll('nav a, header a'));
    for (const a of links) {
      const text = (a.innerText || a.getAttribute('aria-label') || '').toLowerCase();
      if (text.includes('create') || text.includes('새') || text.includes('plus') || a.innerHTML.includes('svg')) {
        a.click(); return 'nav:' + text.substring(0,20);
      }
    }
    return 'not found';
  });
  console.log('1. 만들기:', made);
  await insta.waitForTimeout(3000);
  
  // 2. 게시물 옵션
  await insta.evaluate(() => {
    const items = Array.from(document.querySelectorAll('a, button, span, div, [role="menuitem"]'));
    const post = items.find(el => (el.innerText || '').includes('게시물'));
    if (post) post.click();
  });
  console.log('2. 게시물 선택');
  await insta.waitForTimeout(2000);
  
  // 3. file input (숨겨져 있어도 가능)
  let fi = await insta.$('input[type="file"]');
  if (!fi) {
    // 드래그 드롭 영역 클릭해서 file input 생성 유도
    const dropZone = await insta.$('[class*="drop"], [class*="upload"], [class*="drag"]');
    if (dropZone) await dropZone.click();
    await insta.waitForTimeout(2000);
    fi = await insta.$('input[type="file"]');
  }
  
  if (fi) {
    const paths = IMG_FILES.map(f => path.join(IMG_DIR, f));
    await fi.setInputFiles(paths);
    console.log(`3. ${paths.length}장 업로드 완료`);
    await insta.waitForTimeout(5000);
    
    // 다음 버튼
    for (let i = 0; i < 3; i++) {
      const nb = await insta.$('button:has-text("다음"), div[role="button"]:has-text("다음")');
      if (nb) { await nb.click(); console.log(`   다음 ${i+1}`); await insta.waitForTimeout(2000); }
      else break;
    }
    
    // 캡션
    const ta = await insta.$('textarea');
    if (ta) {
      await ta.evaluate((el, text) => {
        const s = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        s.call(el, text);
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }, CAPTION);
      console.log('4. 캡션 입력');
    }
    
    const sb = await insta.$('button:has-text("공유")');
    if (sb) console.log('\n✅ "공유" 버튼까지 도착! 직접 클릭해주세요!');
    else console.log('\n⚠️ 공유 버튼 없음');
    
  } else {
    console.log('❌ file input 없음');
    // 페이지 상태 확인
    const state = await insta.evaluate(() => document.body.innerText.substring(0, 300));
    console.log('페이지 상태:', state);
  }
  
  process.exit(0);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
